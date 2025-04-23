// 模拟项目数据，实际使用时可以替换为真实的API请求
// 添加 normalizeLangName 函数定义
function normalizeLangName(name) {
    if (!name) return 'default';
    return name.toLowerCase()
        .replace(/\+/g, 'p')
        .replace(/#/g, 'sharp')
        .replace(/\./g, 'dot')
        .replace(/-/g, '')
        .replace(/\s+/g, '');
}

const projectsData = [
    {
        name: "Project-1",
        description: "A sample project description",
        tags: ["JavaScript", "HTML", "CSS"],
        stars: 1,
        forks: 0
    },
    {
        name: "Project-2",
        description: "Another sample project",
        tags: ["JavaScript", "React", "Node.js"],
        stars: 1,
        forks: 0
    },
    {
        name: "Project-3",
        description: "A third sample project",
        tags: ["Python", "Django"],
        stars: 1,
        forks: 0
    }
];

// 在 projectsData 数组前添加正在进行的项目数据
const ongoingProject = {
    name: "Current-Project",
    description: "This is a sample ongoing project description.",
    tags: ["JavaScript", "React", "Node.js"],
    progress: 65, // 进度百分比
    stars: 1,
    forks: 0
};

// GitHub API配置
const GITHUB_USERNAME = 'your-username';
const GITHUB_API_BASE = 'https://api.github.com';
const GITHUB_TOKEN = 'your-github-token'; // 请替换为你的GitHub token

// 获取GitHub数据的函数
async function fetchGitHubData() {
    try {
        const headers = {
            'Accept': 'application/vnd.github.v3+json',
            'Authorization': `Bearer ${GITHUB_TOKEN}`
        };

        // 获取用户仓库列表
        const reposResponse = await fetch(`${GITHUB_API_BASE}/users/${GITHUB_USERNAME}/repos?sort=updated&direction=desc`, {
            headers: headers
        });
        
        if (!reposResponse.ok) {
            throw new Error(`GitHub API error: ${reposResponse.status}`);
        }
        
        const repos = await reposResponse.json();

        // 获取用户信息
        const userResponse = await fetch(`${GITHUB_API_BASE}/users/${GITHUB_USERNAME}`, {
            headers: headers
        });
        
        if (!userResponse.ok) {
            throw new Error(`GitHub API error: ${userResponse.status}`);
        }
        
        const userData = await userResponse.json();

        // 获取每个仓库的详细信息，包括语言统计
        const repoDetails = await Promise.all(repos.map(async (repo) => {
            const languagesResponse = await fetch(repo.languages_url, {
                headers: headers
            });
            const languages = await languagesResponse.json();
            
            // 获取最近的提交
            const commitsResponse = await fetch(`${GITHUB_API_BASE}/repos/${GITHUB_USERNAME}/${repo.name}/commits?per_page=1`, {
                headers: headers
            });
            const commits = await commitsResponse.json();
            
            return {
                name: repo.name,
                description: repo.description || '',
                tags: Object.keys(languages),
                stars: repo.stargazers_count,
                forks: repo.forks_count,
                html_url: repo.html_url,
                updated_at: repo.updated_at,
                created_at: repo.created_at,
                last_commit: commits.length > 0 ? commits[0].commit.author.date : null,
                is_fork: repo.fork,
                language: repo.language,
                open_issues: repo.open_issues_count,
                size: repo.size,
                languages: languages
            };
        }));

        // 按更新时间排序
        repoDetails.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

        // 更新项目数据
        projectsData.length = 0;
        projectsData.push(...repoDetails);

        // 更新进行中的项目（使用最近更新的非fork仓库）
        const mostRecentRepo = repoDetails.find(repo => !repo.is_fork);
        if (mostRecentRepo) {
            ongoingProject.name = mostRecentRepo.name;
            ongoingProject.description = mostRecentRepo.description;
            ongoingProject.tags = mostRecentRepo.tags;
            ongoingProject.stars = mostRecentRepo.stars;
            ongoingProject.forks = mostRecentRepo.forks;
            // 根据最后提交时间计算进度
            const daysSinceLastCommit = (new Date() - new Date(mostRecentRepo.last_commit)) / (1000 * 60 * 60 * 24);
            ongoingProject.progress = Math.max(0, Math.min(100, 100 - Math.floor(daysSinceLastCommit)));
        }

        return repoDetails;
    } catch (error) {
        console.error('Error fetching GitHub data:', error);
        throw error;
    }
}

// 修改渲染项目卡片的函数
function renderProjectCard(project) {
    return `
        <div class="repo-card" onclick="showProjectDetail('${project.name}')">
            <div class="repo-header">
                <span class="repo-title">${project.name}</span>
                ${project.is_fork ? '<span class="forked-badge">Forked</span>' : ''}
            </div>
            <p class="repo-description">${project.description || 'No description available'}</p>
            <div class="repo-meta">
                ${project.language ? `
                    <div class="language-tag">
                        <span class="language-dot" style="background-color: var(--color-${normalizeLangName(project.language)}, var(--color-default));"></span>
                        <span>${project.language}</span>
                    </div>
                ` : ''}
            </div>
            <div class="repo-stats">
                <span class="repo-stat" title="Stars">
                    <svg aria-hidden="true" height="16" viewBox="0 0 16 16" width="16">
                        <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"></path>
                    </svg>
                    ${project.stars}
                </span>
                <span class="repo-stat" title="Forks">
                    <svg aria-hidden="true" height="16" viewBox="0 0 16 16" width="16">
                        <path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z"></path>
                    </svg>
                    ${project.forks}
                </span>
                ${project.open_issues > 0 ? `
                <span class="repo-stat" title="Open Issues">
                    <svg aria-hidden="true" height="16" viewBox="0 0 16 16" width="16">
                        <path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"></path><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z"></path>
                    </svg>
                    ${project.open_issues}
                </span>
                ` : ''}
            </div>
        </div>
    `;
}

// 修改渲染正在进行项目的函数
function renderOngoingProject() {
    return `
        <div class="ongoing-project-title">
            <svg viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true">
                <path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"></path>
                <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z"></path>
            </svg>
            最新项目
        </div>
        <div class="pinned-project">
            <div class="repo-title">${ongoingProject.name}</div>
            <p class="repo-description">${ongoingProject.description}</p>
            <div class="progress-bar">
                <div class="progress" style="width: ${ongoingProject.progress}%"></div>
            </div>
            <div class="repo-meta">
                ${ongoingProject.language ? `
                    <div class="language-tag">
                        <span class="language-dot" style="background-color: var(--color-${normalizeLangName(ongoingProject.language)}, var(--color-default));"></span>
                        <span>${ongoingProject.language}</span>
                    </div>
                ` : ''}
            </div>
            <div class="repo-stats">
                <span class="repo-stat" title="Stars">
                    <svg aria-hidden="true" height="16" viewBox="0 0 16 16" width="16">
                        <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"></path>
                    </svg>
                    ${ongoingProject.stars}
                </span>
                <span class="repo-stat" title="Forks">
                    <svg aria-hidden="true" height="16" viewBox="0 0 16 16" width="16">
                        <path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z"></path>
                    </svg>
                    ${ongoingProject.forks}
                </span>
            </div>
        </div>
    `;
}

// 在现有代码中添加生成贡献数据的函数
function generateContributionData() {
    const data = [];
    const today = new Date();
    const totalDays = 365;

    for (let i = 0; i < totalDays; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - (totalDays - i));
        
        // 随机生成贡献数量（0-4级）
        const level = Math.floor(Math.random() * 5);
        data.push({
            date: date,
            level: level,
            contributions: level === 0 ? 0 : Math.floor(Math.random() * 10) + level
        });
    }
    return data;
}

// 修改获取GitHub贡献数据的函数
async function fetchContributionData(year = new Date().getFullYear()) {
    try {
        const headers = {
            'Accept': 'application/vnd.github.v3+json'
        };
        
        if (GITHUB_TOKEN) {
            headers['Authorization'] = `token ${GITHUB_TOKEN}`;
        }

        // 获取指定年份的贡献数据
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31);
        const response = await fetch(
            `https://api.github.com/users/${GITHUB_USERNAME}/events?per_page=100`, 
            { headers }
        );
        
        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status}`);
        }
        
        const events = await response.json();
        
        // 处理事件数据，按日期分组
        const contributionsByDate = {};
        const activitiesByMonth = {};

        events.forEach(event => {
            const eventDate = new Date(event.created_at);
            if (eventDate >= startDate && eventDate <= endDate) {
                const dateStr = eventDate.toISOString().split('T')[0];
                const monthStr = eventDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });
                
                // 初始化日期的贡献计数
                if (!contributionsByDate[dateStr]) {
                    contributionsByDate[dateStr] = 0;
                }

                // 初始化月份的活动数组
                if (!activitiesByMonth[monthStr]) {
                    activitiesByMonth[monthStr] = [];
                }

                // 处理不同类型的事件
                switch(event.type) {
                    case 'PushEvent':
                        const commitCount = event.payload.commits ? event.payload.commits.length : 0;
                        contributionsByDate[dateStr] += commitCount;
                        if (commitCount > 0) {
                            activitiesByMonth[monthStr].push({
                                type: 'commit',
                                repo: event.repo.name.split('/')[1],
                                count: commitCount,
                                description: `Created ${commitCount} commits in 1 repository`,
                                date: eventDate.toLocaleString('en-US', { month: 'short', day: 'numeric' })
                            });
                        }
                        break;
                    case 'CreateEvent':
                        contributionsByDate[dateStr] += 1;
                        if (event.payload.ref_type === 'repository') {
                            activitiesByMonth[monthStr].push({
                                type: 'create',
                                repo: event.repo.name.split('/')[1],
                                language: event.payload.description || 'Unknown',
                                description: 'Created 1 repository',
                                date: eventDate.toLocaleString('en-US', { month: 'short', day: 'numeric' })
                            });
                        }
                        break;
                    case 'IssuesEvent':
                    case 'PullRequestEvent':
                    case 'IssueCommentEvent':
                    case 'PullRequestReviewEvent':
                        contributionsByDate[dateStr] += 1;
                        break;
                }
            }
        });

        // 生成指定年份的所有日期数据
        const data = [];
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            const contributions = contributionsByDate[dateStr] || 0;
            
            let level = 0;
            if (contributions > 0) {
                if (contributions <= 2) level = 1;
                else if (contributions <= 4) level = 2;
                else if (contributions <= 6) level = 3;
                else level = 4;
            }

            data.push({
                date: new Date(d),
                level: level,
                contributions: contributions
            });
        }

        // 返回贡献数据和活动数据
        return {
            contributionData: data,
            activityData: activitiesByMonth
        };
    } catch (error) {
        console.error('Error fetching contribution data:', error);
        return {
            contributionData: [],
            activityData: {}
        };
    }
}

// 修改渲染活动时间线的函数，添加 activities 参数
function renderActivityTimeline(data, activities = null) {
    // 如果没有提供活动数据，使用默认的示例数据
    const sampleActivities = activities || {
        'March 2025': [
            {
                type: 'commit',
                repo: 'WordPress-LivePhotos',
                count: 2,
                description: 'Created 2 commits in 1 repository'
            },
            {
                type: 'create',
                repo: 'WordPress-LivePhotos',
                language: 'JavaScript',
                description: 'Created 1 repository',
                date: 'Mar 23'
            }
        ]
    };

    let timelineHtml = '';
    let activityCount = 0;
    Object.entries(sampleActivities).forEach(([month, activities], index) => {
        // 只显示前4个活动
        const shouldShow = activityCount < 4;
        timelineHtml += `
            <div class="activity-month ${!shouldShow ? 'hidden-activity' : ''}">
                <div class="activity-month-header">
                    <h3>${month}</h3>
                </div>
                ${activities.map(activity => {
                    if (activityCount >= 4) return '';
                    activityCount++;
                    if (activity.type === 'commit') {
                        return `
                    <div class="activity-item">
                        <div class="activity-icon">
                            <svg class="octicon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16">
                                <path d="M11.93 8.5a4.002 4.002 0 0 1-7.86 0H.75a.75.75 0 0 1 0-1.5h3.32a4.002 4.002 0 0 1 7.86 0h3.32a.75.75 0 0 1 0 1.5Zm-1.43-.75a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0Z"></path>
                            </svg>
                        </div>
                        <div class="activity-content">
                            <div class="activity-header">
                                ${activity.description}
                            </div>
                            <div class="activity-details">
                                <a href="https://github.com/${GITHUB_USERNAME}/${activity.repo}" target="_blank" class="repo-link">
                                    ${activity.repo}
                                </a>
                                <div class="commit-bar" style="background-color: var(--color-calendar-graph-day-L4-bg);"></div>
                            </div>
                        </div>
                    </div>
                        `;
                    } else if (activity.type === 'create') {
                        return `
                    <div class="activity-item">
                        <div class="activity-icon">
                            <svg class="octicon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16">
                                <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z"></path>
                            </svg>
                        </div>
                        <div class="activity-content">
                            <div class="activity-header">
                                ${activity.description}
                            </div>
                            <div class="activity-details">
                                <a href="https://github.com/${GITHUB_USERNAME}/${activity.repo}" target="_blank" class="repo-link">
                                    ${GITHUB_USERNAME}/${activity.repo}
                                </a>
                                <span class="language-tag">
                                    <span class="language-dot" style="background-color: var(--color-${activity.language}, var(--color-default));"></span>
                                    ${activity.language}
                                </span>
                                <span class="activity-date">${activity.date}</span>
                            </div>
                        </div>
                    </div>
                        `;
                    }
                }).join('')}
            </div>
        `;
    });

    if (Object.keys(sampleActivities).length === 0) {
        timelineHtml = `
            <div class="activity-month">
                <div class="activity-month-header">
                    <h3>No activity</h3>
                    </div>
                    <div class="activity-item">
                    <div class="activity-content">
                        <div class="activity-header">
                            This user doesn't have any public activity yet.
                        </div>
                    </div>
                </div>
                            </div>
        `;
    }

    // 只有当有超过4个活动时才显示"Show more"按钮
    if (activityCount > 4) {
        timelineHtml += `
            <div class="show-more">
                <button class="show-more-button" onclick="toggleActivity(event)">
                    Show more activity
                    <svg class="octicon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16">
                        <path d="M12.78 5.22a.749.749 0 0 1 0 1.06l-4.25 4.25a.749.749 0 0 1-1.06 0L3.22 6.28a.749.749 0 1 1 1.06-1.06L8 8.939l3.72-3.719a.749.749 0 0 1 1.06 0Z"></path>
                    </svg>
                </button>
            </div>
        `;
    }

    return timelineHtml;
}

// 修改渲染贡献图的函数
async function renderContributionGraph() {
    const { contributionData: data, activityData } = await fetchContributionData();
    const currentYear = new Date().getFullYear();
    const totalContributions = data.reduce((sum, day) => sum + day.contributions, 0);
    
    return `
        <div class="contributions">
            <div class="contribution-header">
                <div class="contribution-title-group">
                    <h2>${totalContributions} contributions in ${currentYear}</h2>
                    <div class="year-select-container">
                        <select class="year-select" onchange="updateContributionYear(this.value)">
                            <option value="2025" selected>2025</option>
                            <option value="2024">2024</option>
                            <option value="2023">2023</option>
                        </select>
                    </div>
                </div>
            </div>
            
            <div class="contribution-calendar">
                <div class="contribution-grid">
                    ${data.map(day => `
                        <div class="contribution-cell" 
                            data-level="${day.level}"
                            title="${day.date.toLocaleDateString()} - ${day.contributions} contributions">
                        </div>
                    `).join('')}
                </div>
                <div class="contribution-legend">
                    <span>Less</span>
                    ${[0, 1, 2, 3, 4].map(level => 
                        `<div class="legend-item" data-level="${level}"></div>`).join('')}
                    <span>More</span>
                </div>

                <div class="code-review-chart">
                    <div class="code-review-line vertical"></div>
                    <div class="code-review-line horizontal"></div>
                    <div class="code-review-marker" style="left: 25%; top: 50%"></div>
                    <div class="code-review-marker" style="left: 50%; top: 25%"></div>
                    <div class="code-review-marker" style="left: 75%; top: 50%"></div>
                    <div class="code-review-marker" style="left: 50%; top: 75%"></div>
                    <div class="code-review-label top">Code review</div>
                    <div class="code-review-label bottom">Pull requests</div>
                    <div class="code-review-percentage commits">67% Commits</div>
                    <div class="code-review-percentage issues">33% Issues</div>
                </div>
            </div>
            
            <div class="activity-timeline">
                ${renderActivityTimeline(data, activityData)}
            </div>
        </div>
    `;
}

// 修改更新年份的函数
async function updateContributionYear(year) {
    try {
        const content = document.querySelector('.contributions');
        if (!content) return;

        // 更新年份选择器的值
        const yearSelect = document.querySelector('.year-select');
        if (yearSelect) {
            yearSelect.value = year;
        }

        // 重新获取并渲染贡献数据
        const { contributionData: data, activityData } = await fetchContributionData(year);
        const totalContributions = data.reduce((sum, day) => sum + day.contributions, 0);

        // 更新标题
        const header = content.querySelector('.contribution-header h2');
        if (header) {
            header.textContent = `${totalContributions} contributions in ${year}`;
        }

        // 更新贡献网格
        const grid = content.querySelector('.contribution-grid');
        if (grid) {
            grid.innerHTML = data.map(day => `
                <div class="contribution-cell" 
                    data-level="${day.level}"
                    title="${day.date.toLocaleDateString()} - ${day.contributions} contributions">
                </div>
            `).join('');
        }

        // 更新活动时间线
        const timeline = content.querySelector('.activity-timeline');
        if (timeline) {
            timeline.innerHTML = renderActivityTimeline(data, activityData);
        }
    } catch (error) {
        console.error('Error updating contribution year:', error);
    }
}

// 修改渲染概览页面的函数
async function renderOverview() {
    const content = document.querySelector('.content-area');
    
    // 显示骨架屏
    showSkeletonLoading();
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
        // 获取最新的 GitHub 数据
        const repoDetails = await fetchGitHubData();
        
        // 获取贡献图数据
        const contributionGraph = await renderContributionGraph();
        
        // 获取最新的非 fork 仓库
        const mostRecentRepo = repoDetails.find(repo => !repo.is_fork);
        
        // 获取所有使用的编程语言
        const allLanguages = new Set();
        repoDetails.forEach(repo => {
            if (repo.language) allLanguages.add(repo.language);
            if (repo.tags) repo.tags.forEach(tag => allLanguages.add(tag));
        });
        
        content.innerHTML = `
            ${mostRecentRepo ? `
                <div class="ongoing-project-title">
                    <svg viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true">
                        <path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"></path>
                        <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z"></path>
                    </svg>
                    最新项目
                </div>
                <div class="pinned-project">
                    ${renderProjectCard(mostRecentRepo)}
                </div>
            ` : ''}
            ${contributionGraph}
            <div class="skills-card">
                <h2 class="skills-title">Tech stack</h2>
                <div class="skills-container">
                    ${Array.from(allLanguages).map(skill => `
                        <div class="language-tag">
                            <span class="language-dot" style="background-color: var(--color-${normalizeLangName(skill)}, var(--color-default));"></span>
                            <span>${skill}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="recent-projects">
                ${repoDetails.slice(0, 2).map(renderProjectCard).join('')}
            </div>
        `;
    } catch (error) {
        console.error('Error rendering overview:', error);
        content.innerHTML = `
            <div class="error-message">
                <h3>Error loading overview</h3>
                <p>Please try again later.</p>
            </div>
        `;
    } finally {
        await hideSkeletonLoading();
    }
}

// 修改渲染项目库页面的函数
async function renderProjects() {
    const content = document.querySelector('.content-area');
    
    try {
        // 显示骨架屏
        showSkeletonLoading();
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // 获取最新的 GitHub 数据
        const repoDetails = await fetchGitHubData();
        
        // 渲染所有项目
        content.innerHTML = repoDetails.map(repo => renderProjectCard(repo)).join('');
    } catch (error) {
        console.error('Error rendering projects:', error);
        content.innerHTML = `
            <div class="error-message">
                <h3>Error loading projects</h3>
                <p>Please try again later.</p>
            </div>
        `;
    } finally {
        await hideSkeletonLoading();
    }
}

// 修改微信二维码弹窗功能
function showWechat(event) {
    event.preventDefault();
    showQRCode('WeChat', 'path/to/wechat-qr.png', 'Scan to add WeChat');
}

// 添加 QQ 二维码弹窗功能
function showQQ(event) {
    event.preventDefault();
    showQRCode('QQ', 'path/to/qq-qr.png', 'Scan to add QQ');
}

// 通用的二维码弹窗显示函数
function showQRCode(title, qrCodeUrl, description) {
    // 创建遮罩层
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    
    // 创建弹窗
    const popup = document.createElement('div');
    popup.className = 'wechat-popup';
    popup.innerHTML = `
        <img src="${qrCodeUrl}" alt="${title}二维码">
        <p>${description}</p>
    `;
    
    // 添加到页面
    document.body.appendChild(overlay);
    document.body.appendChild(popup);
    
    // 显示弹窗
    setTimeout(() => {
        popup.classList.add('show');
    }, 10);
    
    // 点击遮罩层关闭弹窗
    const closePopup = () => {
        popup.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(overlay);
            document.body.removeChild(popup);
        }, 300);
    };
    
    overlay.addEventListener('click', closePopup);
}

// 获取用户 Stars 的仓库
async function fetchStarredRepos() {
    try {
        const headers = {
            'Accept': 'application/vnd.github.v3+json'
        };
        
        if (GITHUB_TOKEN) {
            headers['Authorization'] = `token ${GITHUB_TOKEN}`;
        }

        const response = await fetch(`${GITHUB_API_BASE}/users/${GITHUB_USERNAME}/starred`, {
            headers: headers
        });
        
        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status}`);
        }
        
        const starredRepos = await response.json();

        // 获取每个仓库的详细信息
        const repoDetails = await Promise.all(starredRepos.map(async (repo) => {
            const languagesResponse = await fetch(repo.languages_url, {
                headers: headers
            });
            const languages = await languagesResponse.json();
            
            return {
                name: repo.name,
                full_name: repo.full_name,
                owner: {
                    login: repo.owner.login,
                    avatar_url: repo.owner.avatar_url
                },
                description: repo.description || '',
                language: repo.language,
                languages_url: repo.languages_url,
                languages: languages,
                html_url: repo.html_url,
                stargazers_count: repo.stargazers_count,
                forks_count: repo.forks_count,
                open_issues_count: repo.open_issues_count,
                created_at: repo.created_at,
                updated_at: repo.updated_at
            };
        }));

        return repoDetails;
    } catch (error) {
        console.error('Error fetching starred repos:', error);
        return [];
    }
}

// 修改渲染 Stars 页面的函数
async function renderStars() {
    const content = document.querySelector('.content-area');
    
    // 显示骨架屏
    showSkeletonLoading();
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
        const starredRepos = await fetchStarredRepos();
        
        if (starredRepos.length === 0) {
            content.innerHTML = `
                <div class="blankslate">
                    <h3>No starred repositories</h3>
                    <p>Stars are a way to keep track of repositories you find interesting.</p>
                </div>
            `;
            return;
        }

        const reposHtml = starredRepos.map(repo => `
            <div class="repo-card">
                <div class="repo-header">
                    <img src="${repo.owner.avatar_url}" alt="${repo.owner.login}" class="owner-avatar">
                    <a href="${repo.html_url}" target="_blank" class="repo-title">${repo.full_name}</a>
                </div>
                <p class="repo-description">${repo.description || 'No description available'}</p>
                <div class="repo-meta">
                    ${repo.language ? `
                        <div class="language-tag">
                            <span class="language-dot" style="background-color: var(--color-${normalizeLangName(repo.language)}, var(--color-default));"></span>
                            <span>${repo.language}</span>
                        </div>
                    ` : ''}
                </div>
                <div class="repo-stats">
                    <span class="repo-stat" title="Stars">
                        <svg aria-hidden="true" height="16" viewBox="0 0 16 16" width="16">
                            <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"></path>
                        </svg>
                        ${repo.stargazers_count}
                    </span>
                    <span class="repo-stat" title="Forks">
                        <svg aria-hidden="true" height="16" viewBox="0 0 16 16" width="16">
                            <path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z"></path>
                        </svg>
                        ${repo.forks_count}
                    </span>
                    ${repo.open_issues_count > 0 ? `
                    <span class="repo-stat" title="Open Issues">
                        <svg aria-hidden="true" height="16" viewBox="0 0 16 16" width="16">
                            <path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"></path><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z"></path>
                        </svg>
                        ${repo.open_issues_count}
                    </span>
                    ` : ''}
                    <span class="repo-stat" title="Last updated">
                        <svg aria-hidden="true" height="16" viewBox="0 0 16 16" width="16">
                            <path d="M1.643 3.143 L.427 1.927 A.25.25 0 0 0 0 2.104 V5.75 c0 .138.112.25.25.25 h3.646 a.25.25 0 0 0 .177-.427 L2.715 4.215 a6.5 6.5 0 1 1-1.18 4.458.75.75 0 1 0-1.493.154 A8.001 8.001 0 1 0 8 0a7.964 7.964 0 0 0-6.357 3.143 z"></path>
                        </svg>
                        ${new Date(repo.updated_at).toLocaleDateString()}
                    </span>
                </div>
            </div>
        `).join('');

        content.innerHTML = reposHtml;
    } catch (error) {
        console.error('Error rendering stars:', error);
        content.innerHTML = `
            <div class="error-message">
                <h3>Error loading starred repositories</h3>
                <p>Please try again later.</p>
            </div>
        `;
    } finally {
        // 隐藏骨架屏
        await hideSkeletonLoading();
    }
}

// 添加获取项目详情的函数
async function fetchProjectDetail(projectName) {
    try {
        const headers = {
            'Accept': 'application/vnd.github.v3+json',
            'Authorization': `token ${GITHUB_TOKEN}`
        };

        // 获取仓库详细信息
        const repoResponse = await fetch(`${GITHUB_API_BASE}/repos/${GITHUB_USERNAME}/${projectName}`, { headers });
        const repoData = await repoResponse.json();

        // 获取语言统计
        const languagesResponse = await fetch(repoData.languages_url, { headers });
        const languages = await languagesResponse.json();

        // 获取最近的提交
        const commitsResponse = await fetch(`${GITHUB_API_BASE}/repos/${GITHUB_USERNAME}/${projectName}/commits?per_page=5`, { headers });
        const commits = await commitsResponse.json();

        // 获取README内容
        let readme = null;
        try {
            const readmeResponse = await fetch(`${GITHUB_API_BASE}/repos/${GITHUB_USERNAME}/${projectName}/readme`, { headers });
            const readmeData = await readmeResponse.json();
            // 使用 decodeURIComponent 和 escape 来正确处理中文内容
            readme = decodeURIComponent(escape(atob(readmeData.content)));
        } catch (error) {
            console.log('No README found');
        }

        return {
            ...repoData,
            languages,
            commits,
            readme
        };
    } catch (error) {
        console.error('Error fetching project detail:', error);
        return null;
    }
}

// 添加显示项目详情的函数
async function showProjectDetail(projectName) {
    // 立即创建并显示模态框和骨架屏
    const modal = document.createElement('div');
    modal.className = 'project-modal';
    modal.innerHTML = `
        <div class="project-modal-header">
            <div class="project-modal-title">
                <svg aria-hidden="true" height="16" viewBox="0 0 16 16" width="16">
                    <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z"></path>
                </svg>
                <span class="repo-link">${GITHUB_USERNAME} / ${projectName}</span>
            </div>
            <div class="project-modal-actions">
                <button class="project-modal-close" onclick="closeProjectModal()">
                    <svg width="24" height="24" viewBox="0 0 24 24">
                        <path d="M5.293 5.293a1 1 0 0 1 1.414 0L12 10.586l5.293-5.293a1 1 0 1 1 1.414 1.414L13.414 12l5.293 5.293a1 1 0 0 1-1.414 1.414L12 13.414l-5.293 5.293a1 1 0 0 1-1.414-1.414L10.586 12 5.293 6.707a1 1 0 0 1 0-1.414z"/>
                    </svg>
                </button>
            </div>
        </div>
        <div class="project-modal-body">
            <div class="skeleton-wrapper">
                <div class="skeleton-card skeleton"></div>
                <div class="skeleton-title skeleton"></div>
                <div class="skeleton-text skeleton"></div>
                <div class="skeleton-text skeleton"></div>
                <div class="skeleton-text skeleton"></div>
                <div class="skeleton-text skeleton"></div>
            </div>
        </div>
    `;

    // 创建遮罩层
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.addEventListener('click', closeProjectModal);

    // 添加到页面
    document.body.appendChild(overlay);
    document.body.appendChild(modal);

    // 显示模态框
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);

    try {
        // 获取项目数据
        const projectData = await fetchProjectDetail(projectName);
        if (!projectData) {
            throw new Error('Failed to fetch project details');
        }

        // 计算语言百分比
        const totalBytes = Object.values(projectData.languages).reduce((a, b) => a + b, 0);
        const languagesWithPercentage = Object.entries(projectData.languages)
            .map(([name, bytes]) => ({
                name,
                bytes,
                percentage: (bytes / totalBytes) * 100
            }))
            .sort((a, b) => b.percentage - a.percentage)
            .map(lang => ({
                ...lang,
                percentage: lang.percentage.toFixed(1)
            }));

        // 辅助函数：规范化语言名称为CSS变量名
        function normalizeLangName(name) {
            if (!name) return 'default';
            return name.toLowerCase()
                .replace(/\+/g, 'p')
                .replace(/#/g, 'sharp')
                .replace(/\./g, 'dot')
                .replace(/-/g, '')
                .replace(/\s+/g, '');
        }

        // 创建语言条形图
        const languageBar = languagesWithPercentage
            .filter(lang => parseFloat(lang.percentage) >= 0.1)
            .map(lang => {
                const langNameLower = normalizeLangName(lang.name);
                return `
                <div class="language-bar-item" 
                    style="width: ${lang.percentage}%; background-color: var(--color-${langNameLower}, var(--color-default));" 
                    title="${lang.name} ${lang.percentage}%">
                </div>
            `;
            }).join('');

        // 更新模态框内容
        modal.innerHTML = `
            <div class="project-modal-header">
                <div class="project-modal-title">
                    <svg aria-hidden="true" height="16" viewBox="0 0 16 16" width="16">
                        <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z"></path>
                    </svg>
                    <a href="${projectData.html_url}" target="_blank" class="repo-link">
                        ${GITHUB_USERNAME} / ${projectData.name}
                    </a>
                </div>
                <div class="project-modal-actions">
                    <a href="${projectData.html_url}" target="_blank" class="github-button">
                        <svg aria-hidden="true" height="16" viewBox="0 0 16 16" width="16">
                            <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"></path>
                        </svg>
                        View on GitHub
                    </a>
                    <button class="project-modal-close" onclick="closeProjectModal()">
                        <svg width="24" height="24" viewBox="0 0 24 24">
                            <path d="M5.293 5.293a1 1 0 0 1 1.414 0L12 10.586l5.293-5.293a1 1 0 1 1 1.414 1.414L13.414 12l5.293 5.293a1 1 0 0 1-1.414 1.414L12 13.414l-5.293 5.293a1 1 0 0 1-1.414-1.414L10.586 12 5.293 6.707a1 1 0 0 1 0-1.414z"/>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="project-modal-body">
                <div class="project-info-section">
                    <p class="project-description">${projectData.description || 'No description available'}</p>
                    
                    <div class="project-meta">
                        <div class="project-meta-item">
                            <svg aria-hidden="true" height="16" viewBox="0 0 16 16" width="16">
                                <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"></path>
                            </svg>
                            ${projectData.stargazers_count} stars
                        </div>
                        <div class="project-meta-item">
                            <svg aria-hidden="true" height="16" viewBox="0 0 16 16" width="16">
                                <path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z"></path>
                            </svg>
                            ${projectData.forks_count} forks
                        </div>
                        <div class="project-meta-item">
                            <svg aria-hidden="true" height="16" viewBox="0 0 16 16" width="16">
                                <path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"></path><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z"></path>
                            </svg>
                            ${projectData.open_issues_count} issues
                        </div>
                        <div class="project-meta-item">
                            <svg aria-hidden="true" height="16" viewBox="0 0 16 16" width="16">
                                <path d="M2 1.75C2 .784 2.784 0 3.75 0h8.5C13.216 0 14 .784 14 1.75v5a1.75 1.75 0 0 1-1.75 1.75h-8.5A1.75 1.75 0 0 1 2 6.75v-5Zm1.75-.25a.25.25 0 0 0-.25.25v5c0 .138.112.25.25.25h8.5a.25.25 0 0 0 .25-.25v-5a.25.25 0 0 0-.25-.25h-8.5ZM0 11.25c0-.966.784-1.75 1.75-1.75h12.5c.966 0 1.75.784 1.75 1.75v3A1.75 1.75 0 0 1 14.25 16H1.75A1.75 1.75 0 0 1 0 14.25v-3Zm1.75-.25a.25.25 0 0 0-.25.25v3c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25v-3a.25.25 0 0 0-.25-.25H1.75Z"></path>
                            </svg>
                            ${(projectData.size / 1024).toFixed(1)} MB
                        </div>
                    </div>

                    <div class="project-languages-section">
                        <div class="language-bar">
                            ${languageBar}
                        </div>
                        <div class="language-list">
                            ${languagesWithPercentage.map(lang => {
                                const langNameLower = normalizeLangName(lang.name);
                                return `
                                <div class="language-item">
                                    <span class="language-color" style="background-color: var(--color-${langNameLower}, var(--color-default));"></span>
                                    <span class="language-name">${lang.name}</span>
                                    <span class="language-percentage">${lang.percentage}%</span>
                                </div>
                            `;
                            }).join('')}
                        </div>
                    </div>
                </div>

                ${projectData.commits ? `
                    <div class="project-section">
                        <h3 class="section-title">Recent Commits</h3>
                        <div class="commits-list">
                            ${projectData.commits.map(commit => `
                                <div class="commit-item">
                                    <div class="commit-header">
                                        <img class="commit-avatar" src="${commit.author?.avatar_url || 'https://github.com/identicons/default.png'}" alt="Author avatar">
                                        <div class="commit-info">
                                            <div class="commit-message">${commit.commit.message}</div>
                                            <div class="commit-meta">
                                                <span class="commit-author">${commit.commit.author.name}</span>
                                                committed on
                                                <span class="commit-date">${new Date(commit.commit.author.date).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                ${projectData.readme ? `
                    <div class="project-section">
                        <h3 class="section-title">README</h3>
                        <div class="readme-content markdown-body">
                            ${marked.parse(projectData.readme)}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;

        // 初始化代码高亮
        modal.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightElement(block);
        });
    } catch (error) {
        console.error('Error loading project details:', error);
        modal.querySelector('.project-modal-body').innerHTML = `
            <div class="error-message">
                <h3>Error loading project details</h3>
                <p>Please try again later.</p>
            </div>
        `;
    }
}

// 添加关闭项目详情的函数
function closeProjectModal() {
    const modal = document.querySelector('.project-modal');
    const overlay = document.querySelector('.overlay');
    
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(modal);
            document.body.removeChild(overlay);
        }, 300);
    }
}

// 添加切换活动显示的函数
function toggleActivity(event) {
    event.preventDefault();
    const hiddenActivities = document.querySelectorAll('.hidden-activity');
    const button = event.currentTarget;
    
    if (hiddenActivities.length > 0) {
        hiddenActivities.forEach(activity => {
            activity.classList.add('show');
        });
        button.innerHTML = `
            Show less activity
            <svg class="octicon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16">
                <path d="M12.78 5.22a.749.749 0 0 1 0 1.06l-4.25 4.25a.749.749 0 0 1-1.06 0L3.22 6.28a.749.749 0 1 1 1.06-1.06L8 8.939l3.72-3.719a.749.749 0 0 1 1.06 0Z"></path>
            </svg>
        `;
    } else {
        const allActivities = document.querySelectorAll('.activity-month');
        allActivities.forEach((activity, index) => {
            if (index > 0) {
                activity.classList.remove('show');
            }
        });
        button.innerHTML = `
            Show more activity
            <svg class="octicon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16">
                <path d="M12.78 5.22a.749.749 0 0 1 0 1.06l-4.25 4.25a.749.749 0 0 1-1.06 0L3.22 6.28a.749.749 0 1 1 1.06-1.06L8 8.939l3.72-3.719a.749.749 0 0 1 1.06 0Z"></path>
            </svg>
        `;
    }
}

function showSkeletonLoading() {
    const contentArea = document.querySelector('.content-area');
    // 清空现有内容
    contentArea.innerHTML = '';
    
    // 创建并添加骨架屏
    const skeletonWrapper = document.createElement('div');
    skeletonWrapper.className = 'skeleton-wrapper';
    skeletonWrapper.style.opacity = '1';
    skeletonWrapper.style.transition = 'opacity 0.3s ease-out';
    skeletonWrapper.innerHTML = Array(3).fill(`
        <div class="skeleton-card skeleton"></div>
        <div class="skeleton-title skeleton"></div>
        <div class="skeleton-text skeleton"></div>
        <div class="skeleton-text skeleton"></div>
    `).join('');
    
    contentArea.appendChild(skeletonWrapper);
    // 记录开始显示的时间
    window.skeletonStartTime = Date.now();
}

async function hideSkeletonLoading() {
    const skeletonWrapper = document.querySelector('.skeleton-wrapper');
    if (skeletonWrapper) {
        // 计算已经显示的时间
        const elapsedTime = Date.now() - window.skeletonStartTime;
        const minimumTime = 1000; // 最少显示1秒
        
        // 如果显示时间不够，等待剩余时间
        if (elapsedTime < minimumTime) {
            await new Promise(resolve => setTimeout(resolve, minimumTime - elapsedTime));
        }
        
        // 添加淡出动画
        skeletonWrapper.style.opacity = '0';
        
        // 等待动画完成后移除
        await new Promise(resolve => setTimeout(resolve, 300));
        skeletonWrapper.remove();
    }
}

// Modify the tab click event handler
document.addEventListener('DOMContentLoaded', async function() {
    const tabs = document.querySelectorAll('.tab');
    
    // 立即显示骨架屏
    showSkeletonLoading();
    
    // 首次加载时获取数据
    try {
        await fetchGitHubData();
        await renderOverview();
    } catch (error) {
        console.error('Error fetching initial data:', error);
        const content = document.querySelector('.content-area');
        content.innerHTML = `
            <div class="error-message">
                <h3>Error loading content</h3>
                <p>Please try again later.</p>
            </div>
        `;
    } finally {
        await hideSkeletonLoading();
    }
    
    tabs.forEach(tab => {
        tab.addEventListener('click', async function(e) {
            e.preventDefault();
            const tabName = this.getAttribute('data-tab');
            
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            // Add active class to clicked tab
            this.classList.add('active');
            
            // 显示骨架屏
            showSkeletonLoading();
            
            try {
                switch(tabName) {
                    case 'overview':
                        await renderOverview();
                        break;
                    case 'projects':
                        await renderProjects();
                        break;
                    case 'stars':
                        await renderStars();
                        break;
                }
            } catch (error) {
                console.error('Error loading content:', error);
                const content = document.querySelector('.content-area');
                content.innerHTML = `
                    <div class="error-message">
                        <h3>Error loading content</h3>
                        <p>Please try again later.</p>
                    </div>
                `;
            } finally {
                await hideSkeletonLoading();
            }
        });
    });
});

// ... existing code ... 

// 添加主题切换功能
function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    // 更新主题
    html.setAttribute('data-theme', newTheme);
    
    // 保存主题偏好到 localStorage
    localStorage.setItem('theme', newTheme);
    
    // 不需要修改SVG内容，通过CSS控制显示隐藏
}

// 初始化主题
function initializeTheme() {
    // 从 localStorage 获取保存的主题，如果没有则使用系统偏好
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    const theme = savedTheme || (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
    
    // 不需要修改SVG内容，通过CSS控制显示隐藏
}

// 在 DOMContentLoaded 事件中初始化主题
document.addEventListener('DOMContentLoaded', function() {
    initializeTheme();
});
