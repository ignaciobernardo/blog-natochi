// ============================================
// Constants & Configuration
// ============================================

const moreEntries = []; // Automatically updated by generate.js
let entriesLoaded = false;

const musicFavorites = {
    song: {
        title: 'Love Takes Miles',
        artist: 'Cameron Winter',
        url: 'https://open.spotify.com/intl-es/track/2zf1izCOz2F22PF27uhxRF?si=016a191521fe45a6'
    },
    album: {
        title: 'Lift Your Skinny Fists Like Antennas To Heaven',
        artist: 'Godspeed You! Black Emperor',
        url: 'https://godspeedyoublackemperor.bandcamp.com/album/lift-your-skinny-fists-like-antennas-to-heaven'
    }
};

const STAMP_CONFIG = {
    WIDTH: 150,
    HEIGHT: 180,
    OVERLAP: 30
};

// ============================================
// Theme Management
// ============================================

function toggleTheme() {
    document.documentElement.classList.toggle('dark-mode');
    const isDark = document.documentElement.classList.contains('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

// ============================================
// Stamps Visibility Management
// ============================================

function toggleStamps() {
    const stampsFooter = document.querySelector('.stamps-footer');
    const stampsToggle = document.getElementById('stamps-toggle');
    const musicSection = document.querySelector('.music-section');
    
    if (!stampsFooter || !stampsToggle) return;
    
    stampsFooter.classList.toggle('visible');
    stampsToggle.classList.toggle('active');
    
    // Show/hide music section when stamps are toggled (only on index page)
    if (musicSection && !musicSection.classList.contains('visible')) {
        musicSection.classList.toggle('visible');
    }
    
    const isVisible = stampsFooter.classList.contains('visible');
    localStorage.setItem('stampsVisible', isVisible ? 'true' : 'false');
}

function initStampsVisibility() {
    const stampsFooter = document.querySelector('.stamps-footer');
    const stampsToggle = document.getElementById('stamps-toggle');
    const musicSection = document.querySelector('.music-section');
    const savedVisibility = localStorage.getItem('stampsVisible');
    
    if (stampsFooter && stampsToggle && savedVisibility === 'true') {
        stampsFooter.classList.add('visible');
        stampsToggle.classList.add('active');
        // Only toggle music section if it exists and is not already visible (index page)
        if (musicSection && !musicSection.classList.contains('visible')) {
            musicSection.classList.add('visible');
        }
    }
}

// ============================================
// Music Section
// ============================================

function initMusicSection() {
    const songLink = document.querySelector('.music-item:first-child a');
    const albumLink = document.querySelector('.music-item:last-child a');
    
    if (songLink && musicFavorites.song) {
        songLink.href = musicFavorites.song.url;
        songLink.textContent = `${musicFavorites.song.title} - ${musicFavorites.song.artist}`;
    }
    
    if (albumLink && musicFavorites.album) {
        albumLink.href = musicFavorites.album.url;
        albumLink.textContent = `${musicFavorites.album.title} - ${musicFavorites.album.artist}`;
    }
}

// ============================================
// Blog Posts Management
// ============================================

function initLoadMorePosts() {
    // This function is no longer needed as "v" now links to posts.html
    // Keeping it for backwards compatibility but it does nothing
}

function initAllPostsPage() {
    const allPostsList = document.getElementById('all-posts-list');
    if (!allPostsList) return;
    
    // Get visible posts from index.html structure
    const visiblePosts = [];
    const indexBlogList = document.querySelector('.blog-list');
    if (indexBlogList) {
        indexBlogList.querySelectorAll('li').forEach(li => {
            const link = li.querySelector('a');
            if (link) {
                visiblePosts.push({
                    href: link.href,
                    text: link.textContent
                });
            }
        });
    }
    
    // Add all posts (visible + hidden from moreEntries)
    visiblePosts.forEach(post => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = post.href;
        a.textContent = post.text;
        li.appendChild(a);
        allPostsList.appendChild(li);
    });
    
    // Add entries from moreEntries
    if (moreEntries.length > 0) {
        moreEntries.forEach(entry => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = `blog/${entry.num}.html`;
            a.textContent = `${entry.num}. ${entry.title}`;
            li.appendChild(a);
            allPostsList.appendChild(li);
        });
    }
}

// ============================================
// Draggable Stamps
// ============================================

function calculateInitialPositions() {
    const { WIDTH, HEIGHT, OVERLAP } = STAMP_CONFIG;
    const stamps = document.querySelectorAll('.stamp');
    const totalStamps = stamps.length;
    
    // Calculate total width needed with overlaps
    const totalWidth = totalStamps * WIDTH - (totalStamps - 1) * OVERLAP;
    
    // Center the stamps horizontally
    const startX = (window.innerWidth - totalWidth) / 2;
    
    // Position at middle of bottom edge (not completely at bottom)
    const bottomY = window.innerHeight - HEIGHT / 2;
    
    // Create positions for all stamps along the bottom edge
    const positions = [];
    for (let i = 0; i < totalStamps; i++) {
        positions.push({
            x: startX + i * (WIDTH - OVERLAP),
            y: bottomY
        });
    }
    
    return positions;
}

function createDragHandlers(stamp) {
    let isDragging = false;
    let currentX, currentY, initialX, initialY, xOffset = 0, yOffset = 0;
    
    const stampId = stamp.getAttribute('data-stamp');
    const savedPos = loadStampPosition(stampId);
    const edgePositions = calculateInitialPositions();
    const index = parseInt(stampId) - 1;
    
    // Set initial position - always use bottom edge positions
    if (edgePositions[index]) {
        xOffset = edgePositions[index].x;
        yOffset = edgePositions[index].y;
        // Clear saved position to use new bottom layout
        localStorage.removeItem(`stamp_${stampId}_pos`);
    } else {
        const { WIDTH, HEIGHT } = STAMP_CONFIG;
        // Fallback: position at bottom center if calculation fails
        xOffset = (window.innerWidth - WIDTH) / 2;
        yOffset = window.innerHeight - HEIGHT / 2;
    }
    
    setTranslate(xOffset, yOffset, stamp);
    
    function dragStart(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const rect = stamp.getBoundingClientRect();
        const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
        const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
        
        initialX = clientX - rect.left;
        initialY = clientY - rect.top;
        
        isDragging = true;
        stamp.style.transition = 'none';
        stamp.style.zIndex = '100';
    }
    
    function drag(e) {
        if (!isDragging) return;
        
        e.preventDefault();
        
        const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
        const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
        
        currentX = clientX - initialX;
        currentY = clientY - initialY;
        
        xOffset = currentX;
        yOffset = currentY;
        
        setTranslate(xOffset, yOffset, stamp);
    }
    
    function dragEnd() {
        if (!isDragging) return;
        
        isDragging = false;
        stamp.style.transition = 'transform 0.2s ease, box-shadow 0.2s ease';
        stamp.style.zIndex = '10';
        
        saveStampPosition(stampId, xOffset, yOffset);
    }
    
    stamp.addEventListener('mousedown', dragStart);
    stamp.addEventListener('touchstart', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('touchmove', drag);
    document.addEventListener('mouseup', dragEnd);
    document.addEventListener('touchend', dragEnd);
}

function initDraggableStamps() {
    const stamps = document.querySelectorAll('.stamp');
    if (stamps.length === 0) return;
    
    stamps.forEach(stamp => createDragHandlers(stamp));
}

function setTranslate(xPos, yPos, el) {
    const rotation = getComputedStyle(el).getPropertyValue('--rotation') || '0deg';
    el.style.left = `${xPos}px`;
    el.style.top = `${yPos}px`;
    el.style.transform = `rotate(${rotation})`;
}

function saveStampPosition(stampId, x, y) {
    const positions = JSON.parse(localStorage.getItem('stampPositions') || '{}');
    positions[stampId] = { x, y };
    localStorage.setItem('stampPositions', JSON.stringify(positions));
}

function loadStampPosition(stampId) {
    const positions = JSON.parse(localStorage.getItem('stampPositions') || '{}');
    return positions[stampId] || null;
}

// ============================================
// Initialization
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    // Stamps toggle
    const stampsToggle = document.getElementById('stamps-toggle');
    if (stampsToggle) {
        stampsToggle.addEventListener('click', toggleStamps);
        initStampsVisibility();
    }
    
    // Load more posts (only on index.html)
    initLoadMorePosts();
    
    // Initialize all posts page (only on posts.html)
    initAllPostsPage();
    
    // Initialize music section (only on things.html where it's visible by default)
    if (document.querySelector('.music-section.visible')) {
        initMusicSection();
    }
    
    // Draggable stamps
    initDraggableStamps();
});
