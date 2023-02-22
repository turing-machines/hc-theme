(function () {
    var UI_DARK = 'ui-dark';
    var UI_LIGHT = 'ui-light';
    var LS_COLOR_SCHEME = 'upi-color-scheme';

    var media = window.matchMedia('(prefers-color-scheme: dark)');

    var color = window.theme.darkMode ? UI_DARK : UI_LIGHT;

    if (media.media !== 'not all') {
        var osColorScheme = media.matches ? UI_DARK : UI_LIGHT;
        var lsColorScheme = localStorage.getItem(LS_COLOR_SCHEME);
        changeClassName(lsColorScheme || osColorScheme);

        if (!lsColorScheme) {
            media.addListener(function () {
                changeClassName(media.matches ? UI_DARK : UI_LIGHT)
            });
        }
    }

    function changeClassName(className) {
        document.documentElement.classList.remove(UI_DARK, UI_LIGHT);
        document.documentElement.classList.add(className);
        color = className;
        window.theme.darkMode = className === UI_DARK;
    }
})();
