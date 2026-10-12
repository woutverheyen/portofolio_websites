// Simple mobile menu toggle (reused on every page)
const btn = document.querySelector('.menu-toggle');
const nav = document.getElementById('primary-navigation');
if (btn && nav) {
    btn.addEventListener('click', ()=>{
        const expanded = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!expanded));
        nav.classList.toggle('is-open', !expanded);
    });

    window.addEventListener('resize', ()=>{
        if (window.innerWidth > 720) {
            nav.classList.remove('is-open');
            btn.setAttribute('aria-expanded', 'false');
        }
    });
}

function waitForImages(images) {
    return Promise.all(images.map((img)=>{
        if (img.complete) {
            return Promise.resolve();
        }
        return new Promise((resolve)=>{
            img.addEventListener('load', resolve, { once: true });
            img.addEventListener('error', resolve, { once: true });
        });
    }));
}

async function initArtBelt() {
    const track = document.querySelector('.art-track');
    if (!track) {
        return;
    }

    track.querySelectorAll('[data-art-clone="true"]').forEach((node)=>node.remove());

    const baseImages = Array.from(track.querySelectorAll('img'));
    if (baseImages.length < 2) {
        return;
    }

    await waitForImages(baseImages);

    const makeSet = ()=>baseImages.map((img)=>{
        const clone = img.cloneNode(true);
        clone.setAttribute('data-art-clone', 'true');
        clone.setAttribute('aria-hidden', 'true');
        return clone;
    });

    makeSet().forEach((clone)=>track.appendChild(clone));

    const firstBase = track.querySelector('img:not([data-art-clone="true"])');
    const firstClone = track.querySelector('[data-art-clone="true"]');
    if (!firstBase || !firstClone) {
        return;
    }

    const loopDistance = firstClone.offsetLeft - firstBase.offsetLeft;
    if (loopDistance <= 0) {
        return;
    }

    while (track.scrollWidth < window.innerWidth + loopDistance) {
        makeSet().forEach((clone)=>track.appendChild(clone));
    }

    const pixelsPerSecond = 70;
    const durationSeconds = Math.max(12, loopDistance / pixelsPerSecond);
    track.style.setProperty('--art-loop-distance', `${loopDistance}px`);
    track.style.setProperty('--art-duration', `${durationSeconds}s`);
}

let artBeltResizeTimer;
window.addEventListener('resize', ()=>{
    clearTimeout(artBeltResizeTimer);
    artBeltResizeTimer = setTimeout(()=>{
        initArtBelt();
    }, 150);
});

const apiKey = 'DDDBBBD6C63C80CAC030D8354AE2EDD1';
const steamId = '76561198798392051';
const topGamesCount = 12;
const steamStatus = document.getElementById('steam-status');
const gamesList = document.getElementById('games');

async function loadSteamGames() {
    if (!steamStatus || !gamesList) {
        return;
    }

    if (!steamId || steamId === 'YOUR_STEAM_ID_64') {
        steamStatus.textContent = 'Vul eerst je SteamID64 in om je games te tonen.';
        return;
    }

    const steamApiUrl = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${encodeURIComponent(apiKey)}&steamid=${encodeURIComponent(steamId)}&include_appinfo=true`;
    const urlsToTry = [
        steamApiUrl,
        `https://api.allorigins.win/raw?url=${encodeURIComponent(steamApiUrl)}`,
        `https://corsproxy.io/?${encodeURIComponent(steamApiUrl)}`
    ];

    let data = null;
    let lastError = null;

    for (const url of urlsToTry) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            data = await response.json();
            break;
        } catch (error) {
            lastError = error;
        }
    }

    if (!data) {
        steamStatus.textContent = 'Steam data kon niet opgehaald worden (waarschijnlijk CORS in de browser). Open lokaal via een webserver of gebruik een backend/proxy.';
        return;
    }

    const games = data?.response?.games;

    if (!Array.isArray(games)) {
        steamStatus.textContent = 'Kon games niet laden. Je profiel kan prive zijn of je SteamID is ongeldig.';
        return;
    }

    if (games.length === 0) {
        steamStatus.textContent = 'Geen games gevonden op dit account.';
        return;
    }

    steamStatus.textContent = 'Most played games:';
    gamesList.innerHTML = '';
    games
        .slice()
        .sort((a, b)=>(b.playtime_forever || 0) - (a.playtime_forever || 0))
        .slice(0, topGamesCount)
        .forEach((game)=>{
            const li = document.createElement('li');
            li.className = 'steam-game-card';

            const cover = document.createElement('img');
            cover.className = 'steam-game-cover';
            cover.alt = `${game.name} cover`;
            const headerUrl = `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appid}/header.jpg`;
            const iconUrl = game.appid && game.img_icon_url
                ? `https://media.steampowered.com/steamcommunity/public/images/apps/${game.appid}/${game.img_icon_url}.jpg`
                : '';
            cover.src = headerUrl;
            if (iconUrl) {
                cover.onerror = () => {
                    cover.onerror = null;
                    cover.src = iconUrl;
                };
            }

            const meta = document.createElement('div');
            meta.className = 'steam-game-meta';

            const name = document.createElement('span');
            name.className = 'steam-game-name';
            name.textContent = game.name;

            const hours = document.createElement('span');
            hours.className = 'steam-game-hours';
            hours.textContent = `${Math.round((game.playtime_forever || 0) / 60)} hrs`;

            meta.appendChild(name);
            meta.appendChild(hours);
            li.appendChild(cover);
            li.appendChild(meta);
            gamesList.appendChild(li);
        });
}

loadSteamGames();
initArtBelt();

