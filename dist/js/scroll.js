//Наблюдатель
class ScrollWatcher {
    constructor(props) {
        let defaultConfig = {
            logging: true,
        }
        this.config = Object.assign(defaultConfig, props);
        this.observer;
        !document.documentElement.classList.contains('watcher') ? this.scrollWatcherRun() : null;
    }
    scrollWatcherUpdate() {
        this.scrollWatcherRun();
    }
    scrollWatcherRun() {
        document.documentElement.classList.add('watcher');
        this.scrollWatcherConstructor(document.querySelectorAll('[data-watch]'));
    }
    scrollWatcherConstructor(items) {
        if (items.length) {
            let uniqParams = uniqArray(Array.from(items).map(function (item) {
                if (item.dataset.watch === 'navigator' && !item.dataset.watchThreshold) {
                    let valueOfThreshold;
                    if (item.clientHeight > 2) {
                        valueOfThreshold =
                            window.innerHeight / 2 / (item.clientHeight - 1);
                        if (valueOfThreshold > 1) {
                            valueOfThreshold = 1;
                        }
                    } else {
                        valueOfThreshold = 1;
                    }
                    item.setAttribute(
                        'data-watch-threshold',
                        valueOfThreshold.toFixed(2)
                    );
                }
                return `${item.dataset.watchRoot ? item.dataset.watchRoot : null}|${item.dataset.watchMargin ? item.dataset.watchMargin : '0px'}|${item.dataset.watchThreshold ? item.dataset.watchThreshold : 0}`;
            }));
            uniqParams.forEach(uniqParam => {
                let uniqParamArray = uniqParam.split('|');
                let paramsWatch = {
                    root: uniqParamArray[0],
                    margin: uniqParamArray[1],
                    threshold: uniqParamArray[2]
                }
                let groupItems = Array.from(items).filter(function (item) {
                    let watchRoot = item.dataset.watchRoot ? item.dataset.watchRoot : null;
                    let watchMargin = item.dataset.watchMargin ? item.dataset.watchMargin : '0px';
                    let watchThreshold = item.dataset.watchThreshold ? item.dataset.watchThreshold : 0;
                    if (
                        String(watchRoot) === paramsWatch.root &&
                        String(watchMargin) === paramsWatch.margin &&
                        String(watchThreshold) === paramsWatch.threshold
                    ) {
                        return item;
                    }
                });

                let configWatcher = this.getScrollWatcherConfig(paramsWatch);

                this.scrollWatcherInit(groupItems, configWatcher);
            });
        }
    }
    getScrollWatcherConfig(paramsWatch) {
        let configWatcher = {}
        if (document.querySelector(paramsWatch.root)) {
            configWatcher.root = document.querySelector(paramsWatch.root);
        }
        configWatcher.rootMargin = paramsWatch.margin;
        if (paramsWatch.margin.indexOf('px') < 0 && paramsWatch.margin.indexOf('%') < 0) {
            return
        }
        if (paramsWatch.threshold === 'prx') {
            paramsWatch.threshold = [];
            for (let i = 0; i <= 1.0; i += 0.005) {
                paramsWatch.threshold.push(i);
            }
        } else {
            paramsWatch.threshold = paramsWatch.threshold.split(',');
        }
        configWatcher.threshold = paramsWatch.threshold;

        return configWatcher;
    }
    scrollWatcherCreate(configWatcher) {
        console.log(configWatcher);
        this.observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                this.scrollWatcherCallback(entry, observer);
            });
        }, configWatcher);
    }
    scrollWatcherInit(items, configWatcher) {
        this.scrollWatcherCreate(configWatcher);
        items.forEach(item => this.observer.observe(item));
    }
    scrollWatcherIntersecting(entry, targetElement) {
        if (entry.isIntersecting) {
            !targetElement.classList.contains('_watcher-view') ? targetElement.classList.add('_watcher-view') : null;
        } else {
            targetElement.classList.contains('_watcher-view') ? targetElement.classList.remove('_watcher-view') : null;
        }
    }
    scrollWatcherOff(targetElement, observer) {
        observer.unobserve(targetElement);
    }
    scrollWatcherCallback(entry, observer) {
        const targetElement = entry.target;
        this.scrollWatcherIntersecting(entry, targetElement);
        targetElement.hasAttribute('data-watch-once') && entry.isIntersecting ? this.scrollWatcherOff(targetElement, observer) : null;
        document.dispatchEvent(new CustomEvent("watcherCallback", {
            detail: {
                entry: entry
            }
        }));
    }
}
modules_flsModules.watcher = new ScrollWatcher({});

//========================================================================================================================================================

//Прокрутка к блоку
let gotoBlock = (targetBlock, noHeader = false, speed = 500, offsetTop = 0) => {
    const targetBlockElement = document.querySelector(targetBlock);

    if (!targetBlockElement) {
        console.warn(`Element ${targetBlock} not found`);
        return;
    }

    let headerItem = '';
    let headerItemHeight = 0;

    if (noHeader) {
        headerItem = 'header.header';
        const headerElement = document.querySelector(headerItem);
        if (headerElement) {
            if (!headerElement.classList.contains('_header-scroll')) {
                headerElement.style.cssText = `transition-duration: 0s;`;
                headerElement.classList.add('_header-scroll');
                headerItemHeight = headerElement.offsetHeight;
                headerElement.classList.remove('_header-scroll');
                setTimeout(() => {
                    headerElement.style.cssText = ``;
                }, 0);
            } else {
                headerItemHeight = headerElement.offsetHeight;
            }
        }
    }

    if (document.documentElement.classList.contains("menu-open")) {
        if (typeof menuClose === 'function') {
            menuClose();
        }
    }

    if (typeof SmoothScroll !== 'undefined') {
        let options = {
            speedAsDuration: true,
            speed: speed,
            header: headerItem,
            offset: offsetTop,
            easing: 'easeOutQuad',
        };
        new SmoothScroll().animateScroll(targetBlockElement, '', options);
    } else {
        let targetBlockElementPosition = targetBlockElement.getBoundingClientRect().top + window.scrollY;

        if (headerItemHeight) {
            targetBlockElementPosition -= headerItemHeight;
        }

        if (offsetTop) {
            targetBlockElementPosition -= offsetTop;
        }

        window.scrollTo({
            top: targetBlockElementPosition,
            behavior: "smooth"
        });
    }
};
function pageNavigation() {
    document.addEventListener("click", pageNavigationAction);
    document.addEventListener("watcherCallback", pageNavigationAction);

    function pageNavigationAction(e) {
        if (e.type === "click") {
            const targetElement = e.target;
            const gotoLink = targetElement.closest('[data-goto]');

            if (gotoLink) {
                const gotoLinkSelector = gotoLink.dataset.goto || '';
                const noHeader = gotoLink.hasAttribute('data-goto-header');
                const gotoSpeed = gotoLink.dataset.gotoSpeed ? parseInt(gotoLink.dataset.gotoSpeed) : 500;
                const offsetTop = gotoLink.dataset.gotoTop ? parseInt(gotoLink.dataset.gotoTop) : 0;

                if (window.modules_flsModules && modules_flsModules.fullpage) {
                    const fullpageSection = document.querySelector(`${gotoLinkSelector}`)?.closest('[data-fp-section]');
                    const fullpageSectionId = fullpageSection ? +fullpageSection.dataset.fpId : null;

                    if (fullpageSectionId !== null) {
                        modules_flsModules.fullpage.switchingSection(fullpageSectionId);
                        if (document.documentElement.classList.contains("menu-open") && typeof menuClose === 'function') {
                            menuClose();
                        }
                    }
                } else {
                    gotoBlock(gotoLinkSelector, noHeader, gotoSpeed, offsetTop);
                }

                e.preventDefault();
            }
        } else if (e.type === "watcherCallback" && e.detail) {
            const entry = e.detail.entry;
            const targetElement = entry.target;

            if (targetElement.dataset.watch === 'navigator') {
                document.querySelectorAll('[data-goto]._navigator-active').forEach(el => {
                    el.classList.remove('_navigator-active');
                });

                const navigatorLinks = findNavigatorLinks(targetElement);
                navigatorLinks.forEach(link => {
                    if (entry.isIntersecting) {
                        link.classList.add('_navigator-active');
                    } else {
                        link.classList.remove('_navigator-active');
                    }
                });
            }
        }
    }

    function findNavigatorLinks(element) {
        const links = [];

        if (element.id) {
            const idLinks = document.querySelectorAll(`[data-goto="#${element.id}"]`);
            links.push(...idLinks);
        }

        if (element.classList.length) {
            element.classList.forEach(className => {
                const classLinks = document.querySelectorAll(`[data-goto=".${className}"]`);
                links.push(...classLinks);
            });
        }

        return links;
    }
}
pageNavigation();

