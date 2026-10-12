// Simple mobile menu toggle (reused on every page)
const btn = document.querySelector('.menu-toggle');
const nav = document.getElementById('primary-navigation');
if (btn && nav) {
    btn.addEventListener('click', () => {
        const expanded = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!expanded));
        nav.classList.toggle('is-open', !expanded);
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth > 720) {
            nav.classList.remove('is-open');
            btn.setAttribute('aria-expanded', 'false');
        }
    });
}

const downloadLink = document.getElementById('download-cv-link');
if (downloadLink && window.html2pdf) {
    downloadLink.addEventListener('click', async (event) => {
        event.preventDefault();
        const cvCard = document.querySelector('.cv-card');
        const nameEl = document.querySelector('.cv-header h1');
        if (!cvCard || !nameEl) return;

        const fullName = nameEl.textContent
            .trim()
            .replace(/\s+/g, ' ')
            .replace(/[\\/:*?"<>|]/g, '');
        const fileName = `CV_${fullName || 'your name'}.pdf`;

        downloadLink.setAttribute('aria-disabled', 'true');
        downloadLink.style.pointerEvents = 'none';
        downloadLink.innerHTML = '<i class="bi bi-download"></i> PDF wordt gemaakt...';

        let exportHost = null;
        try {
            downloadLink.style.visibility = 'hidden';

            // Render from an offscreen clone so the visible page does not flash.
            exportHost = document.createElement('div');
            exportHost.className = 'cv-export-host';

            const exportClone = cvCard.cloneNode(true);
            exportClone.classList.add('cv-export-root');
            const cloneDownloadLink = exportClone.querySelector('#download-cv-link');
            if (cloneDownloadLink) cloneDownloadLink.remove();

            exportHost.appendChild(exportClone);
            document.body.appendChild(exportHost);

            await window.html2pdf()
                .set({
                    margin: [6, 6, 6, 6],
                    filename: fileName,
                    image: { type: 'jpeg', quality: 1 },
                    html2canvas: { scale: 3, useCORS: true, backgroundColor: '#ffffff', scrollY: 0 },
                    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
                    pagebreak: {
                        mode: ['css', 'legacy'],
                        avoid: ['.cv-header', '.cv-section', '.cv-timeline-item', '.cv-project-item']
                    }
                })
                .from(exportClone)
                .save();
        } finally {
            if (exportHost && exportHost.parentNode) {
                exportHost.parentNode.removeChild(exportHost);
            }
            downloadLink.style.visibility = '';
            downloadLink.style.pointerEvents = '';
            downloadLink.removeAttribute('aria-disabled');
            downloadLink.innerHTML = '<i class="bi bi-download"></i> Download CV als PDF';
        }
    });
}

