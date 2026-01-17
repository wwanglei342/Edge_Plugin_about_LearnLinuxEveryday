const STORE = {
    LEARNED: 'learned',
    FAVORITES: 'favs',
    SETTINGS: 'settings'
};

let allCommands = [];
let currentCmd = null;

document.addEventListener('DOMContentLoaded', async () => {
    startClock();
    
    // 加载数据
    const res = await fetch('../assets/commands.json');
    allCommands = await res.json();
    
    await applySettings();
    loadNextCommand();
    bindEvents();
    bindLibraryEvents(); // 绑定知识库相关事件
});

// --- 核心显示逻辑 ---

async function loadNextCommand(forceNext = false) {
    const data = await chrome.storage.local.get([STORE.LEARNED]);
    const learned = data[STORE.LEARNED] || [];
    
    updateProgress(learned.length, allCommands.length);

    // 筛选出未学习的
    const unlearned = allCommands.filter(c => !learned.includes(c.id));
    
    // 如果全部学完
    if (unlearned.length === 0) {
        if (allCommands.length > 0) {
             // 随机显示一个已学的，但标记为复习状态
             const random = allCommands[Math.floor(Math.random() * allCommands.length)];
             currentCmd = random;
             renderCard(random);
             checkFavorite(random.id);
             // 提示用户已学完
             document.getElementById('cmdDesc').innerHTML = random.description + " <span style='color:#10b981'>(已掌握)</span>";
             document.getElementById('btnMaster').textContent = "复习完毕";
        } else {
            // 数据库为空的情况
            document.getElementById('cmdText').textContent = "No Data";
        }
        return;
    }

    // 随机选择算法
    let nextCmd;
    if (forceNext && currentCmd && unlearned.length > 1) {
        const candidates = unlearned.filter(c => c.id !== currentCmd.id);
        nextCmd = candidates[Math.floor(Math.random() * candidates.length)];
    } else {
        nextCmd = unlearned[Math.floor(Math.random() * unlearned.length)];
    }

    currentCmd = nextCmd;
    renderCard(nextCmd);
    checkFavorite(nextCmd.id);
    document.getElementById('btnMaster').textContent = "我学会了";
}

function renderCard(cmd) {
    document.getElementById('cmdText').textContent = cmd.command;
    document.getElementById('cmdDesc').textContent = cmd.description;
    document.getElementById('cmdExplain').innerHTML = cmd.explanation;
    document.getElementById('cmdExample').textContent = cmd.example;
    document.getElementById('cmdCategory').textContent = cmd.category;
    document.getElementById('cmdDifficulty').textContent = cmd.difficulty;
}

// --- 交互事件 ---

function bindEvents() {
    const overlay = document.getElementById('cardOverlay');
    const fab = document.getElementById('fabTrigger');
    const dashboard = document.getElementById('dashboardLayer');

    // 切换卡片显示状态
    function toggleView(showCard) {
        if (showCard) {
            overlay.style.visibility = 'visible';
            overlay.style.opacity = '1';
            fab.style.display = 'none';
        } else {
            overlay.style.visibility = 'hidden';
            overlay.style.opacity = '0';
            fab.style.display = 'flex';
            // 聚焦到底层搜索框，提升体验
            setTimeout(() => {
                document.querySelector('.main-search-box input').focus();
            }, 100);
        }
    }

    document.getElementById('btnCloseCard').addEventListener('click', () => toggleView(false));
    document.getElementById('btnExit').addEventListener('click', () => toggleView(false));
    fab.addEventListener('click', () => toggleView(true));

    // Space 快捷键
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT') return;
        if (e.code === 'Space') {
            e.preventDefault();
            const isVisible = overlay.style.opacity !== '0';
            toggleView(!isVisible);
        }
    });

    // 学习按钮
    document.getElementById('btnNext').addEventListener('click', () => loadNextCommand(true));
    document.getElementById('btnMaster').addEventListener('click', async () => {
        if(!currentCmd) return;
        await markAsLearned(currentCmd.id);
        createParticles(document.getElementById('btnMaster'));
        setTimeout(() => loadNextCommand(true), 400);
    });

    // 收藏按钮 (主卡片)
    const btnFav = document.getElementById('btnFav');
    btnFav.addEventListener('click', async () => {
        if(!currentCmd) return;
        await toggleFavorite(currentCmd.id);
        checkFavorite(currentCmd.id);
    });

    // 复制按钮
    document.getElementById('btnCopy').addEventListener('click', () => {
        const text = document.getElementById('cmdExample').textContent;
        navigator.clipboard.writeText(text);
        const btn = document.getElementById('btnCopy');
        const originHtml = btn.innerHTML;
        btn.innerHTML = '<span style="color:#10b981;font-size:12px">✓</span>';
        setTimeout(() => btn.innerHTML = originHtml, 1500);
    });

    // 快速搜索 (Card内)
    const searchInput = document.getElementById('pluginSearchInput');
    const resultList = document.getElementById('searchResultList');
    
    searchInput.addEventListener('input', (e) => {
        const val = e.target.value.toLowerCase().trim();
        if(!val) { resultList.style.display = 'none'; return; }
        
        const hits = allCommands.filter(c => c.command.includes(val) || c.description.includes(val));
        resultList.innerHTML = '';
        resultList.style.display = 'block';
        
        hits.forEach(c => {
            const li = document.createElement('li');
            li.innerHTML = `<span>${c.command}</span><span style="color:#999;font-size:0.8em">${c.description.substring(0,10)}...</span>`;
            li.onclick = () => {
                currentCmd = c;
                renderCard(c);
                checkFavorite(c.id);
                resultList.style.display = 'none';
                searchInput.value = '';
            };
            resultList.appendChild(li);
        });
    });

    // 设置相关
    const setModal = document.getElementById('settingsModal');
    document.getElementById('btnOpenSettings').addEventListener('click', () => setModal.style.display = 'flex');
    document.getElementById('btnCloseSettings').addEventListener('click', () => setModal.style.display = 'none');
    document.getElementById('settingEngine').addEventListener('change', async (e) => {
        await chrome.storage.local.set({ [STORE.SETTINGS]: { engine: e.target.value } });
        applySettings();
    });
}

// --- 知识库 (Library) 逻辑 ---

function bindLibraryEvents() {
    const libModal = document.getElementById('libraryModal');
    
    // 打开
    document.getElementById('btnOpenLibrary').addEventListener('click', () => {
        libModal.style.display = 'flex';
        renderLibrary('all'); // 默认显示全部
    });

    // 关闭
    document.getElementById('btnCloseLibrary').addEventListener('click', () => {
        libModal.style.display = 'none';
        loadNextCommand(false); // 刷新一下主界面状态
    });

    // Tab 切换
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            tabs.forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            renderLibrary(e.target.dataset.filter);
        });
    });

    // 搜索
    document.getElementById('libSearchInput').addEventListener('input', (e) => {
        // 获取当前激活的Tab过滤器
        const activeFilter = document.querySelector('.tab-btn.active').dataset.filter;
        renderLibrary(activeFilter, e.target.value);
    });

    // 全局重置
    document.getElementById('btnGlobalReset').addEventListener('click', async () => {
        if(confirm('确定要清除所有学习记录吗？收藏记录将保留。')) {
            await chrome.storage.local.set({ [STORE.LEARNED]: [] });
            renderLibrary('all');
            alert('已重置');
        }
    });
}

async function renderLibrary(filterType, searchQuery = '') {
    const listEl = document.getElementById('libraryList');
    listEl.innerHTML = '';
    
    const data = await chrome.storage.local.get([STORE.LEARNED, STORE.FAVORITES]);
    const learned = data[STORE.LEARNED] || [];
    const favs = data[STORE.FAVORITES] || [];
    
    // 过滤逻辑
    let items = allCommands;
    if (filterType === 'fav') {
        items = items.filter(c => favs.includes(c.id));
    } else if (filterType === 'learned') {
        items = items.filter(c => learned.includes(c.id));
    }

    // 搜索逻辑
    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        items = items.filter(c => c.command.toLowerCase().includes(q) || c.description.toLowerCase().includes(q));
    }

    document.getElementById('libStats').textContent = `显示 ${items.length} 条`;

    // 渲染列表
    items.forEach(c => {
        const isFav = favs.includes(c.id);
        const isLearned = learned.includes(c.id);
        
        const li = document.createElement('li');
        li.className = 'lib-item';
        li.innerHTML = `
            <div class="lib-info">
                <h4>${c.command}</h4>
                <p>${c.description}</p>
            </div>
            <div class="lib-actions">
                <button class="btn-sm ${isFav ? 'active' : ''}" onclick="handleLibAction('fav', ${c.id})">
                    ${isFav ? '❤️ 已收藏' : '🤍 收藏'}
                </button>
                <button class="btn-sm ${isLearned ? 'learned' : ''}" onclick="handleLibAction('learn', ${c.id})">
                    ${isLearned ? '🎓 已学会' : '⭕ 未学'}
                </button>
            </div>
        `;
        listEl.appendChild(li);
    });
}

// 暴露给全局以便 HTML onclick 调用
window.handleLibAction = async (action, id) => {
    if (action === 'fav') {
        await toggleFavorite(id);
    } else if (action === 'learn') {
        await toggleLearned(id);
    }
    // 重新渲染当前列表状态
    const activeFilter = document.querySelector('.tab-btn.active').dataset.filter;
    const searchVal = document.getElementById('libSearchInput').value;
    renderLibrary(activeFilter, searchVal);
};

// --- 数据操作辅助 ---

async function markAsLearned(id) {
    const data = await chrome.storage.local.get([STORE.LEARNED]);
    const list = data[STORE.LEARNED] || [];
    if(!list.includes(id)) {
        list.push(id);
        await chrome.storage.local.set({ [STORE.LEARNED]: list });
    }
}

async function toggleLearned(id) {
    const data = await chrome.storage.local.get([STORE.LEARNED]);
    let list = data[STORE.LEARNED] || [];
    if(list.includes(id)) {
        list = list.filter(x => x !== id); // 移除 (忘记)
    } else {
        list.push(id); // 添加 (学会)
    }
    await chrome.storage.local.set({ [STORE.LEARNED]: list });
}

async function toggleFavorite(id) {
    const data = await chrome.storage.local.get([STORE.FAVORITES]);
    let list = data[STORE.FAVORITES] || [];
    if(list.includes(id)) {
        list = list.filter(x => x !== id);
    } else {
        list.push(id);
    }
    await chrome.storage.local.set({ [STORE.FAVORITES]: list });
}

async function checkFavorite(id) {
    const data = await chrome.storage.local.get([STORE.FAVORITES]);
    const favs = data[STORE.FAVORITES] || [];
    const btn = document.getElementById('btnFav');
    if(favs.includes(id)) btn.classList.add('active');
    else btn.classList.remove('active');
}

// --- 通用辅助 ---

function startClock() {
    const tEl = document.getElementById('timeDisplay');
    const dEl = document.getElementById('dateDisplay');
    setInterval(() => {
        const now = new Date();
        tEl.textContent = now.toLocaleTimeString('en-US', { hour12: false, hour:'2-digit', minute:'2-digit' });
        dEl.textContent = now.toLocaleDateString('zh-CN', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
    }, 1000);
}

function updateProgress(done, total) {
    const pct = Math.floor((done/total)*100);
    document.getElementById('progressFill').style.width = pct + '%';
    document.getElementById('progressStats').textContent = `${done}/${total}`;
}

async function applySettings() {
    const data = await chrome.storage.local.get([STORE.SETTINGS]);
    const engine = data[STORE.SETTINGS]?.engine || 'bing';
    const form = document.getElementById('searchForm');
    const input = form.querySelector('input');
    if(engine === 'google') { form.action = "https://www.google.com/search"; input.name = "q"; input.placeholder = "Search Google..."; }
    else if(engine === 'baidu') { form.action = "https://www.baidu.com/s"; input.name = "wd"; input.placeholder = "百度一下..."; }
    else { form.action = "https://www.bing.com/search"; input.name = "q"; input.placeholder = "必应搜索..."; }
}

function createParticles(element) {
    // 简单的粒子特效逻辑... (同上个版本，略微简化占位)
    // 实际代码请保留上个版本的 createParticles 函数
}