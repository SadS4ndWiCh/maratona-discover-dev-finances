const Theme = {
    changingTheme: false,

    toggleLightDark() {
        document.querySelector('.theme-switch').addEventListener('click', () => {
            if(Theme.changingTheme) return
            Theme.changingTheme = true;

            const htmlTag = document.querySelector('html');
            const theme = htmlTag.getAttribute('data-theme');

            if(theme === 'dark') {
                htmlTag.setAttribute('data-theme', 'light');
            } else if(theme === 'light') {
                htmlTag.setAttribute('data-theme', 'dark');
            }
            setTimeout(() => {
                Theme.changingTheme = false;
            }, 100);

            window.localStorage.setItem('theme', htmlTag.dataset.theme);
        });
    },

    applyInitialTheme() {
        const theme = window.localStorage.getItem('theme');
        if(theme != null) {
            const htmlTag = document.querySelector('html');
            htmlTag.setAttribute('data-theme', theme);
        }
    }
}

Theme.applyInitialTheme();