// 模拟项目数据，实际使用时可以替换为真实的API请求
const projectsData = [
    {
        name: "WordPress-LivePhotos",
        description: "在WordPress支持LivePhotos",
        tags: ["JavaScript", "PHP", "CSS"],
        stars: 1,
        forks: 0
    },
    {
        name: "Sasariki.github.io",
        description: "个人网站",
        tags: ["JavaScript", "HTML", "CSS"],
        stars: 1,
        forks: 0
    },
    {
        name: "x-html",
        description: "An HTML page that mimics the macOS interface",
        tags: ["HTML"],
        stars: 1,
        forks: 0
    },
    {
        name: "Team-EtherArc-web",
        description: "Team EtherArc web",
        tags: ["HTML"],
        stars: 0,
        forks: 0
    },
    {
        name: "go-proxy-bingai",
        description: "用Vue3和Go搭建的微软New Bing演示站点，拥有一致的UI体验，支持ChatGPT提示词，支持API调用，国内可用。",
        tags: ["HTML", "Vue", "Go"],
        stars: 0,
        forks: 0
    }
];

// 在 projectsData 数组前添加正在进行的项目数据
const ongoingProject = {
    name: "WordPress-LivePhotos",
    description: "在WordPress支持LivePhotos，这是一个正在开发中的重要项目。",
    tags: ["JavaScript", "PHP", "CSS"],
    progress: 65, // 进度百分比
    stars: 1,
    forks: 0
};

// GitHub API配置
const GITHUB_USERNAME = '换成你自己的';
const GITHUB_API_BASE = 'https://api.github.com';
const GITHUB_TOKEN = '换成你自己的';

// 获取GitHub仓库数据的函数
async function fetchGitHubData() {
    try {
        const headers = {
            'Accept': 'application/vnd.github.v3+json'
        };
        
        if (GITHUB_TOKEN) {
            headers['Authorization'] = `token ${GITHUB_TOKEN}`;
        }

        // 获取用户仓库列表
        const reposResponse = await fetch(`${GITHUB_API_BASE}/users/${GITHUB_USERNAME}/repos`, {
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
                size: repo.size
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

        // 重新渲染页面
        renderOverview();
        
        return repoDetails;
    } catch (error) {
        console.error('Error fetching GitHub data:', error);
        // 显示错误信息给用户
        const content = document.querySelector('.content-area');
        content.innerHTML = `
            <div class="error-message">
                <h3>Error fetching GitHub data</h3>
                <p>${error.message}</p>
                <p>Please check your internet connection and try again.</p>
                ${GITHUB_TOKEN ? '' : '<p>Consider adding a GitHub token to increase API rate limits.</p>'}
            </div>
        `;
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
                    <div class="language-tag language-${project.language}">
                        <span class="language-dot"></span>
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
            正在进行中的项目
        </div>
        <div class="pinned-project">
            <div class="repo-title">${ongoingProject.name}</div>
            <p class="repo-description">${ongoingProject.description}</p>
            <div class="progress-bar">
                <div class="progress" style="width: ${ongoingProject.progress}%"></div>
            </div>
            <div class="repo-meta">
                ${ongoingProject.language ? `
                    <div class="language-tag language-${ongoingProject.language}">
                        <span class="language-dot"></span>
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
        ],
        'February 2025': [
            {
                type: 'commit',
                repo: 'Team-EtherArc-web',
                count: 3,
                description: 'Created 3 commits in 1 repository'
            }
        ]
    };

    let timelineHtml = '';
    const maxVisibleActivities = 3; // Maximum number of visible activities initially
    let visibleActivitiesCount = 0;
    let totalActivitiesCount = 0;
    let currentMonthVisible = true;

    Object.entries(sampleActivities).forEach(([month, activities], monthIndex) => {
        // Check if we should hide this month
        if (visibleActivitiesCount >= maxVisibleActivities) {
            currentMonthVisible = false;
        }
        
        timelineHtml += `
            <div class="activity-month ${currentMonthVisible ? '' : 'hidden-activity'}">
                <div class="activity-month-header">
                    <h3>${month}</h3>
                </div>`;
        
        activities.forEach((activity, activityIndex) => {
            totalActivitiesCount++;
            
            if (currentMonthVisible) {
                visibleActivitiesCount++;
                if (visibleActivitiesCount >= maxVisibleActivities) {
                    currentMonthVisible = false;
                }
            }
            
            if (activity.type === 'commit') {
                timelineHtml += `
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
                    </div>`;
            } else if (activity.type === 'create') {
                timelineHtml += `
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
                                <span class="language-tag language-${activity.language}">
                                    <span class="language-dot"></span>
                                    ${activity.language}
                                </span>
                                <span class="activity-date">${activity.date}</span>
                            </div>
                        </div>
                    </div>`;
            }
        });
        
        timelineHtml += `</div>`;
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

    if (totalActivitiesCount > maxVisibleActivities) {
        timelineHtml += `
            <div class="show-more">
                <button class="show-more-button" onclick="toggleActivity(event)">
                    Show more activity (${totalActivitiesCount - maxVisibleActivities} more)
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
    const contributionGraph = await renderContributionGraph();
    
    content.innerHTML = `
        ${renderOngoingProject()}
        ${contributionGraph}
        <div class="skills-card">
            <h2 class="skills-title">Tech stack</h2>
            <div class="skills-container">
                ${[
                    "HTML", "CSS", "JavaScript", "React", "Node.js",
                    "Git", "Vue", "TypeScript", "MongoDB", "PHP",
                    "Python", "MySQL", "Linux"
                ].map(skill => `
                    <div class="language-tag language-${skill}">
                        <span class="language-dot"></span>
                        <span>${skill}</span>
                    </div>
                `).join('')}
            </div>
        </div>
        ${projectsData.slice(0, 2).map(renderProjectCard).join('')}
    `;
}

// 修改渲染项目库页面的函数
function renderProjects() {
    const content = document.querySelector('.content-area');
    content.innerHTML = `
        ${renderOngoingProject()}
        ${projectsData.map(renderProjectCard).join('')}
    `;
}

// 修改微信二维码弹窗功能
function showWechat(event) {
    event.preventDefault();
    showQRCode('微信', 'https://cdn.motsuni.cn/wechat.png', '扫码添加微信');
}

// 添加 QQ 二维码弹窗功能
function showQQ(event) {
    event.preventDefault();
    showQRCode('QQ', 'https://cdn.motsuni.cn//5F0F254804122675E05D936AC8081975.png', '扫码添加QQ');
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

// 渲染 Stars 页面
async function renderStars() {
    const content = document.querySelector('.content-area');
    content.innerHTML = '<div class="loading">Loading starred repositories...</div>';

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
                    <div class="language-tag language-${repo.language}">
                        <span class="language-dot"></span>
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
}

// 修改事件监听器以支持 Stars 标签
document.addEventListener('DOMContentLoaded', function() {
    // 获取所有标签页
    const tabs = document.querySelectorAll('.tab');
    
    // 为每个标签添加点击事件
    tabs.forEach(tab => {
        tab.addEventListener('click', function(e) {
            e.preventDefault();
            
            // 移除所有标签的激活状态
            tabs.forEach(t => t.classList.remove('active'));
            // 添加当前标签的激活状态
            this.classList.add('active');
            
            // 根据标签类型渲染不同内容
            const tabType = this.getAttribute('data-tab');
            if (tabType === 'projects') {
                renderProjects();
            } else if (tabType === 'stars') {
                renderStars();
            } else {
                renderOverview();
            }
        });
    });
    
    // 初始化显示概览页面
    renderOverview();
    
    // 获取GitHub数据
    fetchGitHubData();

    // 初始化主题
    initTheme();
});

// 主题切换功能
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    // 更新图标
    updateThemeIcon(newTheme);
}

// 初始化主题
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

// 更新主题图标
function updateThemeIcon(theme) {
    const themeSwitch = document.querySelector('.theme-switch');
    if (theme === 'dark') {
        themeSwitch.innerHTML = `
            <svg t="1736854625127" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="6512" width="32" height="32"><path d="M512.000213 733.353497c-122.06857 0-221.353283-99.284713-221.353283-221.353284S389.931643 290.64693 512.000213 290.64693 733.353497 389.931643 733.353497 512.000213 634.026117 733.353497 512.000213 733.353497z m0-357.373767A136.148482 136.148482 0 0 0 375.97973 512.000213 136.148482 136.148482 0 0 0 512.000213 648.020697 136.148482 136.148482 0 0 0 648.020697 512.000213 136.148482 136.148482 0 0 0 512.000213 375.97973zM554.666613 171.735673A42.154403 42.154403 0 0 1 512.000213 213.335413c-23.551853 0-42.6664-18.645217-42.6664-41.59974V41.603153A42.154403 42.154403 0 0 1 512.000213 0.003413c23.551853 0 42.6664 18.645217 42.6664 41.59974v130.13252zM554.666613 982.397273A42.154403 42.154403 0 0 1 512.000213 1023.997013c-23.594519 0-42.6664-18.687883-42.6664-41.59974v-130.175186A42.111737 42.111737 0 0 1 512.000213 810.665013c23.551853 0 42.6664 18.60255 42.6664 41.59974v130.13252zM171.735673 469.333813c22.954523 0 41.59974 19.114547 41.59974 42.6664 0 23.594519-18.645217 42.6664-41.59974 42.6664H41.603153A42.154403 42.154403 0 0 1 0.003413 512.000213c0-23.551853 18.645217-42.6664 41.59974-42.6664h130.13252zM982.397273 469.333813c22.954523 0 41.59974 19.114547 41.59974 42.6664 0 23.594519-18.687883 42.6664-41.59974 42.6664h-130.175186A42.111737 42.111737 0 0 1 810.665013 512.000213c0-23.551853 18.60255-42.6664 41.59974-42.6664h130.13252zM241.239239 722.430898a42.06907 42.06907 0 0 1 59.562294 0.767995 42.111737 42.111737 0 0 1 0.767996 59.562295l-92.031425 92.074091a42.154403 42.154403 0 0 1-59.562295-0.853328 42.154403 42.154403 0 0 1-0.767995-59.562294l92.031425-91.988759zM814.462323 149.207814a42.154403 42.154403 0 0 1 59.562294 0.767995 42.154403 42.154403 0 0 1 0.767996 59.562295l-92.031425 92.031425a42.06907 42.06907 0 0 1-59.562295-0.767996 42.111737 42.111737 0 0 1-0.810661-59.562294l92.074091-92.031425zM241.239239 301.526862a42.19707 42.19707 0 0 0 59.604961-0.725329 42.111737 42.111737 0 0 0 0.767995-59.562294L209.538104 149.122481a42.154403 42.154403 0 0 0-59.562295 0.853328 42.111737 42.111737 0 0 0-0.767995 59.562295l92.031425 91.988758zM814.462323 874.792613a42.111737 42.111737 0 0 0 59.562294-0.810662 42.154403 42.154403 0 0 0 0.767996-59.562294l-92.031425-92.031425a42.06907 42.06907 0 0 0-59.562295 0.767995 42.111737 42.111737 0 0 0-0.810661 59.562294l92.074091 92.074092z" fill="#5B5B5B" p-id="6513"></path></svg>
        `;
    } else {
        themeSwitch.innerHTML = `
            <svg t="1736854601551" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="5240" width="32" height="32"><path d="M439.04383639 224.33271976a289.43717504 289.43717504 0 0 0-89.06329676 39.44690807c-27.5075319 18.12412161-51.158867 39.64960558-70.96389486 64.57645191-19.79019562 24.92684633-35.31880082 53.25011237-46.62042137 84.97474006C221.10449032 445.05050411 215.45368042 478.01109252 215.45368042 512c0 40.16870887 7.81621301 78.48347702 23.45358166 115.04318192 15.64725682 36.67341315 36.77228986 68.19039996 63.2910532 94.76354538 26.53359488 26.56820206 58.11485196 47.57952611 94.69927585 63.23667111 36.59431134 15.65714501 75.00301286 23.48324474 115.16183354 23.48324475 33.97407594 0 66.85061917-5.56182137 98.62468557-16.89310498 31.76417894-11.32633953 60.10227581-26.77584294 85.01429133-46.65502781 24.87740834-19.77536407 46.43255539-43.46625042 64.57150781-70.96389488a290.15403174 290.15403174 0 0 0 39.43701989-88.98913905c-8.3056532 0.72180079-17.71378249 1.13213991-28.0958481 1.1321392-45.21637032 0-88.35138342-8.85936294-129.45942212-26.46932463-41.1327577-17.71872658-76.62459295-41.50848964-106.44089858-71.27535655C505.84007277 458.54719011 482.10963587 423.01086095 464.42057238 381.91765379 446.7562286 340.81455917 437.94135957 297.65977044 437.94135957 252.4483442c0-10.40184195 0.39550758-19.77536407 1.15685891-28.01674772l-0.049438-0.09887672zM512.02976157 141.21192041c8.32542811 0 16.51242896 0.31146168 24.6054972 0.92944167-16.4036648 35.32374419-24.60549719 72.09603405-24.60549719 110.30698212 0 35.12104668 6.84227598 68.69961578 20.58121076 100.83458258 13.70927096 32.03114601 32.15474243 59.63261126 55.35124448 82.80933769 23.16683898 23.16683898 50.76830423 41.60736635 82.82416923 55.30674985 32.02125855 13.69938351 65.654209 20.60098567 100.78514387 20.60098568 38.23072298 0 75.03267594-8.24138293 110.35147675-24.62032874 0.59326099 8.14250622 0.86517214 16.28006837 0.86517213 24.62032874 0 33.57856837-4.43956893 66.43533597-13.29893256 98.46648269-8.90880166 32.03114601-21.28817928 61.69419283-37.24195443 88.78149743-15.92411206 27.19112615-35.31880082 52.11797247-58.09013296 74.87941716-22.77627549 22.76144395-47.74267309 42.12152555-74.87447306 58.09013223-27.15157487 15.96366261-56.75529553 28.32326532-88.78644152 37.28644905A368.16784419 368.16784419 0 0 1 512.00009921 882.78807959a368.20739474 368.20739474 0 0 1-98.48625832-13.28904439c-32.03609009-8.95824037-61.6249792-21.31784236-88.79138561-37.28150569-27.12685589-15.96860669-52.08336529-35.32868827-74.89919206-58.09013223-22.7515565-22.76144395-42.13635709-47.68829101-58.05058169-74.87941715-15.96366261-27.0922487-28.34304097-56.75529553-37.2518426-88.78149744A367.9354836 367.9354836 0 0 1 141.21201889 512c0-33.57856837 4.4494571-66.43533597 13.30882004-98.46648269 8.90880166-32.03114601 21.28817928-61.69419283 37.25184259-88.78149744 15.91916798-27.19112615 35.29902519-52.11797247 58.0505817-74.87941715 22.81582676-22.86526476 47.77233617-42.22534634 74.89919206-58.09013223C351.89380578 175.81880789 381.4826949 163.36032846 413.51878498 154.50096479A368.20739474 368.20739474 0 0 1 512.00009921 141.21192041h0.02966236z" p-id="5241"></path></svg>
        `;
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
    const projectData = await fetchProjectDetail(projectName);
    if (!projectData) return;

    // 计算语言百分比
    const totalBytes = Object.values(projectData.languages).reduce((a, b) => a + b, 0);
    const languagesWithPercentage = Object.entries(projectData.languages).map(([name, bytes]) => ({
        name,
        percentage: ((bytes / totalBytes) * 100).toFixed(1)
    }));

    // 创建语言条形图
    const languageBar = languagesWithPercentage.map(lang => `
        <div class="language-bar-item" style="width: ${lang.percentage}%; background-color: var(--color-${lang.name.toLowerCase()});" title="${lang.name} ${lang.percentage}%"></div>
    `).join('');

    const modalHtml = `
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
                        ${languagesWithPercentage.map(lang => `
                            <div class="language-item">
                                <span class="language-color" style="background-color: var(--color-${lang.name.toLowerCase()});"></span>
                                <span class="language-name">${lang.name}</span>
                                <span class="language-percentage">${lang.percentage}%</span>
                            </div>
                        `).join('')}
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

    // 创建模态框
    const modal = document.createElement('div');
    modal.className = 'project-modal';
    modal.innerHTML = modalHtml;

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
        // 初始化代码高亮
        modal.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightElement(block);
        });
    }, 10);
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
    const hiddenActivities = document.querySelectorAll('.activity-month.hidden-activity');
    const button = event.currentTarget || event.target;
    
    // Debug information - can be removed later
    console.log('Hidden activities found:', hiddenActivities.length);
    
    // Check if any hidden activity is currently visible by looking for the "show" class
    let allHidden = true;
    hiddenActivities.forEach(activity => {
        if (activity.classList.contains('show')) {
            allHidden = false;
        }
    });
    
    console.log('All activities hidden:', allHidden);
    
    if (!allHidden) {
        // At least one hidden activity is visible, so hide all of them
        hiddenActivities.forEach(activity => {
            activity.classList.remove('show');
        });
        
        // Find total count for the button text
        const totalActivities = document.querySelectorAll('.activity-item').length;
        const visibleActivities = document.querySelectorAll('.activity-month:not(.hidden-activity) .activity-item').length;
        const hiddenCount = totalActivities - visibleActivities;
        
        // Update button text
        button.innerHTML = `
            Show more activity (${hiddenCount} more)
            <svg class="octicon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16">
                <path d="M12.78 5.22a.749.749 0 0 1 0 1.06l-4.25 4.25a.749.749 0 0 1-1.06 0L3.22 6.28a.749.749 0 1 1 1.06-1.06L8 8.939l3.72-3.719a.749.749 0 0 1 1.06 0Z"></path>
            </svg>
        `;
    } else {
        // All activities are hidden, so show them
        hiddenActivities.forEach(activity => {
            activity.classList.add('show');
        });
        
        // Update button text
        button.innerHTML = `
            Show less activity
            <svg class="octicon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16">
                <path d="M3.22 10.78a.749.749 0 0 1 0-1.06l4.25-4.25a.749.749 0 0 1 1.06 0l4.25 4.25a.749.749 0 1 1-1.06 1.06L8 6.939 4.28 10.719a.749.749 0 0 1-1.06 0Z"></path>
            </svg>
        `;
    }
} 
