<style>
/* =========================================================
   POOL PILOTS PREMIUM MEGA MENU
   One-Widget Version
========================================================= */

#poolPilotsNav {
    --pp-purple: #6750a4;
    --pp-purple-dark: #503b88;
    --pp-purple-light: #f5f2fb;
    --pp-orange: #ffa000;
    --pp-orange-dark: #e89000;
    --pp-orange-light: #fff6e6;
    --pp-white: #ffffff;
    --pp-text: #201a2d;
    --pp-text-light: #6d6679;
    --pp-border: #ebe6f2;

    position: relative;
    width: 100%;
    z-index: 999999;
    font-family: inherit;
}

#poolPilotsNav,
#poolPilotsNav * {
    box-sizing: border-box;
}

#poolPilotsNav ul,
#poolPilotsNav li {
    margin: 0;
    padding: 0;
    list-style: none;
}

#poolPilotsNav a {
    text-decoration: none !important;
}

#poolPilotsNav button {
    font-family: inherit;
}

/* =========================================================
   MAIN NAVIGATION
========================================================= */

#poolPilotsNav .pp-nav {
    position: relative;
    width: 100%;
    overflow: visible;
}

#poolPilotsNav .pp-menu {
    display: flex !important;
    align-items: center;
    justify-content: flex-end;
    gap: 3px;
    width: 100%;
    margin: 0;
    padding: 0;
}

#poolPilotsNav .pp-menu-item {
    position: static;
}

#poolPilotsNav .pp-menu-head {
    position: relative;
    display: flex;
    align-items: center;
    min-height: 52px;
    border-radius: 10px;
}

#poolPilotsNav .pp-main-link {
    display: flex;
    align-items: center;
    min-height: 52px;
    padding: 0 13px;

    color: var(--pp-text) !important;

    font-size: 15px;
    font-weight: 700;
    line-height: 1;

    white-space: nowrap;

    transition:
        color 0.2s ease,
        background 0.2s ease;
}

#poolPilotsNav .pp-main-link:hover,
#poolPilotsNav .pp-menu-item:hover > .pp-menu-head .pp-main-link {
    color: var(--pp-purple) !important;
}

/* =========================================================
   DROPDOWN ARROW
========================================================= */

#poolPilotsNav .pp-arrow-button {
    display: flex;
    align-items: center;
    justify-content: center;

    width: 30px;
    height: 52px;

    margin-left: -9px;
    padding: 0;

    border: 0;
    outline: 0;

    background: transparent;
    color: var(--pp-text);

    cursor: pointer;
}

#poolPilotsNav .pp-arrow-button svg {
    width: 15px;
    height: 15px;

    transition: transform 0.25s ease;
}

#poolPilotsNav .pp-menu-item:hover .pp-arrow-button,
#poolPilotsNav .pp-menu-item.pp-open .pp-arrow-button {
    color: var(--pp-purple);
}

#poolPilotsNav .pp-menu-item:hover .pp-arrow-button svg,
#poolPilotsNav .pp-menu-item.pp-open .pp-arrow-button svg {
    transform: rotate(180deg);
}

/* =========================================================
   ORANGE ACTIVE INDICATOR
========================================================= */

#poolPilotsNav .pp-has-dropdown > .pp-menu-head::after {
    content: "";

    position: absolute;
    left: 13px;
    right: 28px;
    bottom: 1px;

    height: 2px;

    border-radius: 20px;
    background: var(--pp-orange);

    transform: scaleX(0);
    transform-origin: center;

    transition: transform 0.22s ease;
}

#poolPilotsNav .pp-has-dropdown:hover > .pp-menu-head::after,
#poolPilotsNav .pp-has-dropdown.pp-open > .pp-menu-head::after {
    transform: scaleX(1);
}

/* =========================================================
   DROPDOWN BASE
========================================================= */

#poolPilotsNav .pp-dropdown {
    display: block !important;

    position: absolute;

    top: calc(100% + 11px);
    left: 50%;

    z-index: 9999999;

    background: var(--pp-white);

    border: 1px solid rgba(103, 80, 164, 0.12);
    border-radius: 18px;

    box-shadow:
        0 28px 70px rgba(41, 27, 75, 0.15),
        0 7px 20px rgba(41, 27, 75, 0.06);

    opacity: 0;
    visibility: hidden;
    pointer-events: none;

    transform: translate(-50%, 10px);

    transition:
        opacity 0.2s ease,
        visibility 0.2s ease,
        transform 0.2s ease;
}

/* Hover bridge */

#poolPilotsNav .pp-dropdown::before {
    content: "";

    position: absolute;

    top: -17px;
    left: 0;
    right: 0;

    height: 20px;
}

/* Open desktop dropdown */

#poolPilotsNav .pp-menu-item:hover > .pp-dropdown,
#poolPilotsNav .pp-menu-item.pp-open > .pp-dropdown,
#poolPilotsNav .pp-dropdown:hover {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;

    transform: translate(-50%, 0);
}

/* =========================================================
   POOL SERVICES MEGA MENU
========================================================= */

#poolPilotsNav .pp-services-mega {
    width: min(970px, calc(100vw - 40px));
    padding: 29px 29px 0;
}

#poolPilotsNav .pp-mega-label {
    margin: 0 0 23px;

    color: var(--pp-orange-dark);

    font-size: 11px;
    font-weight: 900;
    line-height: 1;

    letter-spacing: 1.8px;
    text-transform: uppercase;
}

#poolPilotsNav .pp-services-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 28px;
}

#poolPilotsNav .pp-service-column {
    min-width: 0;
}

/* =========================================================
   CATEGORY HEADER
========================================================= */

#poolPilotsNav .pp-category-head {
    display: flex;
    align-items: center;

    gap: 11px;

    margin-bottom: 13px;
}

#poolPilotsNav .pp-category-icon {
    display: flex;
    align-items: center;
    justify-content: center;

    width: 43px;
    height: 43px;
    flex: 0 0 43px;

    border-radius: 11px;

    background: var(--pp-purple-light);
    color: var(--pp-purple);

    transition:
        background 0.2s ease,
        color 0.2s ease,
        transform 0.2s ease;
}

#poolPilotsNav .pp-category-icon svg {
    width: 21px;
    height: 21px;
}

#poolPilotsNav .pp-category-head:hover .pp-category-icon {
    background: var(--pp-purple);
    color: #ffffff;

    transform: translateY(-1px);
}

#poolPilotsNav .pp-category-title {
    margin: 0;

    font-size: 16px;
    font-weight: 800;
    line-height: 1.3;
}

#poolPilotsNav .pp-category-title a {
    color: var(--pp-text) !important;

    transition: color 0.2s ease;
}

#poolPilotsNav .pp-category-head:hover .pp-category-title a {
    color: var(--pp-purple) !important;
}

/* =========================================================
   SERVICE LINKS
========================================================= */

#poolPilotsNav .pp-service-link {
    position: relative;

    display: flex;
    align-items: center;

    min-height: 39px;

    padding: 9px 28px 9px 12px;

    border-radius: 8px;

    color: #514a5c !important;

    font-size: 13.5px;
    font-weight: 600;
    line-height: 1.35;

    transition:
        background 0.18s ease,
        color 0.18s ease,
        padding-left 0.18s ease;
}

#poolPilotsNav .pp-service-link::after {
    content: "→";

    position: absolute;
    right: 11px;

    color: var(--pp-orange);

    font-size: 16px;
    font-weight: 700;

    opacity: 0;

    transform: translateX(-4px);

    transition:
        opacity 0.18s ease,
        transform 0.18s ease;
}

#poolPilotsNav .pp-service-link:hover {
    padding-left: 15px;

    background: var(--pp-purple-light);
    color: var(--pp-purple) !important;
}

#poolPilotsNav .pp-service-link:hover::after {
    opacity: 1;

    transform: translateX(0);
}

/* =========================================================
   RESIDENTIAL / COMMERCIAL CARDS
========================================================= */

#poolPilotsNav .pp-type-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;

    gap: 12px;

    margin-top: 24px;
    padding-top: 22px;

    border-top: 1px solid var(--pp-border);
}

#poolPilotsNav .pp-type-card {
    display: flex;
    align-items: center;

    gap: 12px;

    padding: 13px 15px;

    border: 1px solid var(--pp-border);
    border-radius: 12px;

    background: #ffffff;

    transition:
        border-color 0.2s ease,
        background 0.2s ease,
        transform 0.2s ease,
        box-shadow 0.2s ease;
}

#poolPilotsNav .pp-type-card:hover {
    border-color: rgba(103, 80, 164, 0.3);

    background: var(--pp-purple-light);

    transform: translateY(-1px);

    box-shadow: 0 8px 20px rgba(62, 42, 105, 0.08);
}

#poolPilotsNav .pp-type-icon {
    display: flex;
    align-items: center;
    justify-content: center;

    width: 40px;
    height: 40px;
    flex: 0 0 40px;

    border-radius: 10px;

    background: var(--pp-orange-light);
    color: var(--pp-orange-dark);
}

#poolPilotsNav .pp-type-icon svg {
    width: 20px;
    height: 20px;
}

#poolPilotsNav .pp-type-content {
    min-width: 0;
}

#poolPilotsNav .pp-type-title {
    display: block;

    margin-bottom: 2px;

    color: var(--pp-text);

    font-size: 13.5px;
    font-weight: 800;
    line-height: 1.3;
}

#poolPilotsNav .pp-type-description {
    display: block;

    color: var(--pp-text-light);

    font-size: 11.5px;
    font-weight: 500;
    line-height: 1.4;
}

/* =========================================================
   MEGA MENU FOOTER
========================================================= */

#poolPilotsNav .pp-mega-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;

    gap: 20px;

    margin: 22px -29px 0;
    padding: 17px 29px;

    border-top: 1px solid var(--pp-border);
    border-radius: 0 0 18px 18px;

    background: #faf8fd;
}

#poolPilotsNav .pp-all-services {
    display: inline-flex;
    align-items: center;

    gap: 7px;

    color: var(--pp-purple) !important;

    font-size: 13.5px;
    font-weight: 800;

    transition:
        color 0.2s ease,
        gap 0.2s ease;
}

#poolPilotsNav .pp-all-services:hover {
    gap: 10px;

    color: var(--pp-orange-dark) !important;
}

#poolPilotsNav .pp-quote {
    display: inline-flex;
    align-items: center;
    justify-content: center;

    gap: 7px;

    min-height: 40px;

    padding: 0 18px;

    border-radius: 9px;

    background: var(--pp-purple);
    color: #ffffff !important;

    font-size: 13px;
    font-weight: 800;

    transition:
        background 0.2s ease,
        transform 0.2s ease;
}

#poolPilotsNav .pp-quote:hover {
    background: var(--pp-purple-dark);
    color: #ffffff !important;

    transform: translateY(-1px);
}

/* =========================================================
   SERVICE AREAS / BRANDS
========================================================= */

#poolPilotsNav .pp-small-dropdown {
    width: min(500px, calc(100vw - 40px));
    padding: 25px;
}

#poolPilotsNav .pp-brand-dropdown {
    width: min(390px, calc(100vw - 40px));
}

#poolPilotsNav .pp-small-head {
    display: flex;
    align-items: flex-start;

    gap: 11px;

    margin-bottom: 18px;
}

#poolPilotsNav .pp-small-icon {
    display: flex;
    align-items: center;
    justify-content: center;

    width: 40px;
    height: 40px;
    flex: 0 0 40px;

    border-radius: 10px;

    background: var(--pp-purple-light);
    color: var(--pp-purple);
}

#poolPilotsNav .pp-small-icon svg {
    width: 20px;
    height: 20px;
}

#poolPilotsNav .pp-small-title {
    margin: 0 0 3px;

    color: var(--pp-text);

    font-size: 15px;
    font-weight: 800;
    line-height: 1.3;
}

#poolPilotsNav .pp-small-text {
    margin: 0;

    color: var(--pp-text-light);

    font-size: 11.5px;
    line-height: 1.45;
}

#poolPilotsNav .pp-location-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));

    gap: 6px;
}

#poolPilotsNav .pp-brand-grid {
    display: grid;
    grid-template-columns: 1fr;

    gap: 6px;
}

#poolPilotsNav .pp-small-link {
    display: flex;
    align-items: center;
    justify-content: space-between;

    min-height: 42px;

    gap: 10px;

    padding: 0 12px;

    border-radius: 8px;

    color: #514a5c !important;

    font-size: 13.5px;
    font-weight: 700;

    transition:
        color 0.18s ease,
        background 0.18s ease;
}

#poolPilotsNav .pp-small-link .pp-small-arrow {
    color: var(--pp-orange);

    opacity: 0;

    transform: translateX(-4px);

    transition:
        opacity 0.18s ease,
        transform 0.18s ease;
}

#poolPilotsNav .pp-small-link:hover {
    background: var(--pp-purple-light);
    color: var(--pp-purple) !important;
}

#poolPilotsNav .pp-small-link:hover .pp-small-arrow {
    opacity: 1;

    transform: translateX(0);
}

#poolPilotsNav .pp-small-footer {
    margin-top: 15px;
    padding-top: 15px;

    border-top: 1px solid var(--pp-border);
}

#poolPilotsNav .pp-small-footer a {
    color: var(--pp-purple) !important;

    font-size: 13px;
    font-weight: 800;
}

#poolPilotsNav .pp-small-footer a:hover {
    color: var(--pp-orange-dark) !important;
}

/* =========================================================
   PHONE CTA
========================================================= */

#poolPilotsNav .pp-call {
    display: inline-flex;
    align-items: center;
    justify-content: center;

    gap: 8px;

    min-height: 46px;

    margin-left: 8px;
    padding: 0 18px;

    border-radius: 10px;

    background: var(--pp-orange);
    color: #ffffff !important;

    font-size: 14px;
    font-weight: 800;
    line-height: 1;

    white-space: nowrap;

    box-shadow: 0 8px 20px rgba(255, 160, 0, 0.2);

    transition:
        background 0.2s ease,
        transform 0.2s ease,
        box-shadow 0.2s ease;
}

#poolPilotsNav .pp-call:hover {
    background: var(--pp-orange-dark);
    color: #ffffff !important;

    transform: translateY(-1px);

    box-shadow: 0 10px 24px rgba(255, 160, 0, 0.28);
}

#poolPilotsNav .pp-call svg {
    width: 16px;
    height: 16px;
}

/* =========================================================
   MOBILE BUTTON
========================================================= */

#poolPilotsNav .pp-mobile-button {
    display: none !important;

    align-items: center;
    justify-content: center;

    width: 46px;
    height: 46px;

    margin-left: auto;
    padding: 0;

    border: 1px solid var(--pp-border);
    border-radius: 10px;

    background: #ffffff;
    color: var(--pp-purple);

    cursor: pointer;
}

#poolPilotsNav .pp-mobile-button svg {
    width: 24px;
    height: 24px;
}

/* =========================================================
   TABLET / MOBILE
========================================================= */

@media (max-width: 1024px) {

    #poolPilotsNav .pp-nav {
        display: flex;
        justify-content: flex-end;
    }

    #poolPilotsNav .pp-mobile-button {
        display: flex !important;
    }

    #poolPilotsNav .pp-menu {
        position: absolute;

        top: calc(100% + 10px);
        right: 0;

        display: none !important;
        flex-direction: column;
        align-items: stretch;

        gap: 0;

        width: min(440px, calc(100vw - 26px));
        max-height: calc(100vh - 110px);

        padding: 9px;

        overflow-x: hidden;
        overflow-y: auto;

        border: 1px solid var(--pp-border);
        border-radius: 16px;

        background: #ffffff;

        box-shadow:
            0 25px 60px rgba(44, 30, 79, 0.18);
    }

    #poolPilotsNav.pp-mobile-open .pp-menu {
        display: flex !important;
    }

    #poolPilotsNav .pp-menu-item {
        width: 100%;

        border-bottom: 1px solid #f0edf5;
    }

    #poolPilotsNav .pp-menu-item:last-child {
        border-bottom: 0;
    }

    #poolPilotsNav .pp-menu-head {
        width: 100%;
    }

    #poolPilotsNav .pp-main-link {
        flex: 1;

        min-height: 50px;

        padding: 0 12px;
    }

    #poolPilotsNav .pp-arrow-button {
        width: 48px;
        height: 50px;

        margin: 0;
    }

    #poolPilotsNav .pp-has-dropdown > .pp-menu-head::after {
        display: none;
    }

    /* Disable desktop hover opening */

    #poolPilotsNav .pp-dropdown,
    #poolPilotsNav .pp-menu-item:hover > .pp-dropdown {
        position: static;

        display: none !important;

        width: 100%;

        margin: 0;
        padding: 0 9px 13px;

        border: 0;
        border-radius: 0;

        background: #ffffff;

        box-shadow: none;

        opacity: 1;
        visibility: visible;
        pointer-events: auto;

        transform: none;
    }

    #poolPilotsNav .pp-menu-item.pp-open > .pp-dropdown {
        display: block !important;
    }

    #poolPilotsNav .pp-dropdown::before {
        display: none;
    }

    #poolPilotsNav .pp-services-mega {
        width: 100%;

        padding: 3px 9px 13px;
    }

    #poolPilotsNav .pp-mega-label {
        margin: 10px 3px 16px;
    }

    #poolPilotsNav .pp-services-grid {
        grid-template-columns: 1fr;

        gap: 13px;
    }

    #poolPilotsNav .pp-service-column {
        padding: 13px;

        border: 1px solid var(--pp-border);
        border-radius: 12px;
    }

    #poolPilotsNav .pp-category-head {
        margin-bottom: 7px;
    }

    #poolPilotsNav .pp-type-grid {
        grid-template-columns: 1fr;

        margin-top: 14px;
        padding-top: 14px;
    }

    #poolPilotsNav .pp-mega-footer {
        flex-direction: column;
        align-items: stretch;

        margin: 15px 0 0;

        padding: 14px;

        border: 1px solid var(--pp-border);
        border-radius: 11px;
    }

    #poolPilotsNav .pp-all-services {
        justify-content: center;
    }

    #poolPilotsNav .pp-quote {
        width: 100%;
    }

    #poolPilotsNav .pp-small-dropdown,
    #poolPilotsNav .pp-brand-dropdown {
        width: 100%;

        padding: 6px 9px 13px;
    }

    #poolPilotsNav .pp-call {
        width: 100%;

        margin: 10px 0 2px;
    }
}

/* =========================================================
   SMALL MOBILE
========================================================= */

@media (max-width: 520px) {

    #poolPilotsNav .pp-menu {
        right: 0;

        width: calc(100vw - 20px);
    }

    #poolPilotsNav .pp-location-grid {
        grid-template-columns: 1fr;
    }

    #poolPilotsNav .pp-type-description {
        display: none;
    }
}

/* =========================================================
   ELEMENTOR OVERFLOW SUPPORT
========================================================= */

.elementor-widget-html:has(#poolPilotsNav),
.elementor-widget-html:has(#poolPilotsNav) > .elementor-widget-container {
    overflow: visible !important;
}
</style>


<div
    id="poolPilotsNav"
    style="position:relative;width:100%;z-index:999999;"
>

    <nav
        class="pp-nav"
        aria-label="Pool Pilots Main Navigation"
        style="position:relative;width:100%;"
    >

        <!-- MOBILE BUTTON -->
        <button
            class="pp-mobile-button"
            type="button"
            aria-label="Open navigation"
            aria-expanded="false"
            style="display:none;"
        >
            <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
            >
                <path d="M4 6h16"></path>
                <path d="M4 12h16"></path>
                <path d="M4 18h16"></path>
            </svg>
        </button>


        <ul
            class="pp-menu"
            style="display:flex;align-items:center;justify-content:flex-end;gap:3px;list-style:none;margin:0;padding:0;"
        >

            <!-- ABOUT US -->
            <li class="pp-menu-item">

                <div class="pp-menu-head">

                    <a
                        class="pp-main-link"
                        href="/about-us/"
                    >
                        About Us
                    </a>

                </div>

            </li>


            <!-- =====================================================
                 POOL SERVICES
            ====================================================== -->

            <li class="pp-menu-item pp-has-dropdown">

                <div class="pp-menu-head">

                    <a
                        class="pp-main-link"
                        href="/services/"
                    >
                        Pool Services
                    </a>

                    <button
                        class="pp-arrow-button"
                        type="button"
                        aria-label="Open Pool Services menu"
                        aria-expanded="false"
                    >
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2.2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        >
                            <path d="m6 9 6 6 6-6"></path>
                        </svg>
                    </button>

                </div>


                <div
                    class="pp-dropdown pp-services-mega"
                    style="display:none;"
                >

                    <p class="pp-mega-label">
                        Pool Services
                    </p>


                    <div class="pp-services-grid">

                        <!-- POOL CLEANING -->
                        <div class="pp-service-column">

                            <div class="pp-category-head">

                                <span class="pp-category-icon">

                                    <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="1.8"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    >
                                        <path d="M3 15c1.5 0 1.5 1 3 1s1.5-1 3-1 1.5 1 3 1 1.5-1 3-1 1.5 1 3 1 1.5-1 3-1"></path>
                                        <path d="M3 19c1.5 0 1.5 1 3 1s1.5-1 3-1 1.5 1 3 1 1.5-1 3-1 1.5 1 3 1 1.5-1 3-1"></path>
                                        <path d="M7 12V7a3 3 0 0 1 6 0"></path>
                                        <path d="M7 9h6"></path>
                                    </svg>

                                </span>


                                <h3 class="pp-category-title">

                                    <a href="/pool-cleaning/">
                                        Pool Cleaning
                                    </a>

                                </h3>

                            </div>


                            <ul>

                                <li>
                                    <a
                                        class="pp-service-link"
                                        href="/weekly-pool-cleaning/"
                                    >
                                        Weekly Pool Cleaning
                                    </a>
                                </li>

                                <li>
                                    <a
                                        class="pp-service-link"
                                        href="/green-pool-cleaning/"
                                    >
                                        Green Pool Cleaning
                                    </a>
                                </li>

                                <li>
                                    <a
                                        class="pp-service-link"
                                        href="/filter-cleaning/"
                                    >
                                        Filter Cleaning
                                    </a>
                                </li>

                                <li>
                                    <a
                                        class="pp-service-link"
                                        href="/chemical-balancing/"
                                    >
                                        Chemical Balancing
                                    </a>
                                </li>

                            </ul>

                        </div>


                        <!-- POOL REPAIR -->
                        <div class="pp-service-column">

                            <div class="pp-category-head">

                                <span class="pp-category-icon">

                                    <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="1.8"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    >
                                        <path d="M14.7 6.3a4 4 0 0 0-5 5L3 18v3h3l6.7-6.7a4 4 0 0 0 5-5l-2.4 2.4-3-3z"></path>
                                    </svg>

                                </span>


                                <h3 class="pp-category-title">

                                    <a href="/pool-repair/">
                                        Pool Repair
                                    </a>

                                </h3>

                            </div>


                            <ul>

                                <li>
                                    <a
                                        class="pp-service-link"
                                        href="/pool-pump-repair/"
                                    >
                                        Pool Pump Repair
                                    </a>
                                </li>

                                <li>
                                    <a
                                        class="pp-service-link"
                                        href="/pool-filter-repair/"
                                    >
                                        Pool Filter Repair
                                    </a>
                                </li>

                                <li>
                                    <a
                                        class="pp-service-link"
                                        href="/pool-heater-repair/"
                                    >
                                        Pool Heater Repair
                                    </a>
                                </li>

                                <li>
                                    <a
                                        class="pp-service-link"
                                        href="/pool-leak-repair/"
                                    >
                                        Pool Leak Repair
                                    </a>
                                </li>

                                <li>
                                    <a
                                        class="pp-service-link"
                                        href="/pool-automation-repair/"
                                    >
                                        Pool Automation Repair
                                    </a>
                                </li>

                                <li>
                                    <a
                                        class="pp-service-link"
                                        href="/equipment-repair-and-replacement/"
                                    >
                                        Equipment Repair & Replacement
                                    </a>
                                </li>

                            </ul>

                        </div>


                        <!-- POOL MAINTENANCE -->
                        <div class="pp-service-column">

                            <div class="pp-category-head">

                                <span class="pp-category-icon">

                                    <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="1.8"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    >
                                        <circle cx="12" cy="12" r="3"></circle>

                                        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1z"></path>
                                    </svg>

                                </span>


                                <h3 class="pp-category-title">

                                    <a href="/pool-maintenance/">
                                        Pool Maintenance
                                    </a>

                                </h3>

                            </div>


                            <ul>

                                <li>
                                    <a
                                        class="pp-service-link"
                                        href="/preventative-maintenance-for-pool/"
                                    >
                                        Preventative Maintenance
                                    </a>
                                </li>

                                <li>
                                    <a
                                        class="pp-service-link"
                                        href="/seasonal-pool-maintenance/"
                                    >
                                        Seasonal Pool Maintenance
                                    </a>
                                </li>

                                <li>
                                    <a
                                        class="pp-service-link"
                                        href="/pool-inspections/"
                                    >
                                        Pool Inspections
                                    </a>
                                </li>

                                <li>
                                    <a
                                        class="pp-service-link"
                                        href="/pool-equipment-maintenance/"
                                    >
                                        Pool Equipment Maintenance
                                    </a>
                                </li>

                                <li>
                                    <a
                                        class="pp-service-link"
                                        href="/pool-draining-and-washing/"
                                    >
                                        Pool Draining & Washing
                                    </a>
                                </li>

                            </ul>

                        </div>

                    </div>


                    <!-- RESIDENTIAL / COMMERCIAL -->
                    <div class="pp-type-grid">

                        <a
                            class="pp-type-card"
                            href="/residential-pool-cleaning-and-repair/"
                        >

                            <span class="pp-type-icon">

                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="1.8"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                >
                                    <path d="m3 11 9-7 9 7"></path>
                                    <path d="M5 10v10h14V10"></path>
                                    <path d="M9 20v-6h6v6"></path>
                                </svg>

                            </span>


                            <span class="pp-type-content">

                                <span class="pp-type-title">
                                    Residential Pool Cleaning & Repair
                                </span>

                                <span class="pp-type-description">
                                    Professional pool care for Greater Phoenix homeowners.
                                </span>

                            </span>

                        </a>


                        <a
                            class="pp-type-card"
                            href="/commercial-pool-cleaning-and-repair/"
                        >

                            <span class="pp-type-icon">

                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="1.8"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                >
                                    <path d="M4 21V5h10v16"></path>
                                    <path d="M14 9h6v12"></path>
                                    <path d="M7 8h4"></path>
                                    <path d="M7 12h4"></path>
                                    <path d="M7 16h4"></path>
                                    <path d="M17 13h1"></path>
                                    <path d="M17 17h1"></path>
                                </svg>

                            </span>


                            <span class="pp-type-content">

                                <span class="pp-type-title">
                                    Commercial Pool Cleaning & Repair
                                </span>

                                <span class="pp-type-description">
                                    Reliable service for commercial pool properties.
                                </span>

                            </span>

                        </a>

                    </div>


                    <!-- MEGA FOOTER -->
                    <div class="pp-mega-footer">

                        <a
                            class="pp-all-services"
                            href="/services/"
                        >
                            View all pool services
                            <span>→</span>
                        </a>


                        <a
                            class="pp-quote"
                            href="/get-a-quote/"
                        >
                            Get a Fast Quote
                            <span>→</span>
                        </a>

                    </div>

                </div>

            </li>


            <!-- =====================================================
                 SERVICE AREAS
            ====================================================== -->

            <li class="pp-menu-item pp-has-dropdown">

                <div class="pp-menu-head">

                    <a
                        class="pp-main-link"
                        href="/service-areas/"
                    >
                        Service Areas
                    </a>


                    <button
                        class="pp-arrow-button"
                        type="button"
                        aria-label="Open Service Areas menu"
                        aria-expanded="false"
                    >
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2.2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        >
                            <path d="m6 9 6 6 6-6"></path>
                        </svg>
                    </button>

                </div>


                <div
                    class="pp-dropdown pp-small-dropdown"
                    style="display:none;"
                >

                    <div class="pp-small-head">

                        <span class="pp-small-icon">

                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="1.8"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            >
                                <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0z"></path>
                                <circle cx="12" cy="10" r="2.5"></circle>
                            </svg>

                        </span>


                        <div>

                            <h3 class="pp-small-title">
                                Areas We Serve
                            </h3>

                            <p class="pp-small-text">
                                Professional pool service throughout Greater Phoenix.
                            </p>

                        </div>

                    </div>


                    <div class="pp-location-grid">

                        <a
                            class="pp-small-link"
                            href="/scottsdale/"
                        >
                            <span>Scottsdale</span>
                            <span class="pp-small-arrow">→</span>
                        </a>


                        <a
                            class="pp-small-link"
                            href="/mesa/"
                        >
                            <span>Mesa</span>
                            <span class="pp-small-arrow">→</span>
                        </a>


                        <a
                            class="pp-small-link"
                            href="/phoenix/"
                        >
                            <span>Phoenix</span>
                            <span class="pp-small-arrow">→</span>
                        </a>


                        <a
                            class="pp-small-link"
                            href="/chandler/"
                        >
                            <span>Chandler</span>
                            <span class="pp-small-arrow">→</span>
                        </a>


                        <a
                            class="pp-small-link"
                            href="/gilbert/"
                        >
                            <span>Gilbert</span>
                            <span class="pp-small-arrow">→</span>
                        </a>


                        <a
                            class="pp-small-link"
                            href="/glendale/"
                        >
                            <span>Glendale</span>
                            <span class="pp-small-arrow">→</span>
                        </a>


                        <a
                            class="pp-small-link"
                            href="/tempe/"
                        >
                            <span>Tempe</span>
                            <span class="pp-small-arrow">→</span>
                        </a>

                    </div>


                    <div class="pp-small-footer">

                        <a href="/service-areas/">
                            View all service areas →
                        </a>

                    </div>

                </div>

            </li>


            <!-- =====================================================
                 BRANDS
            ====================================================== -->

            <li class="pp-menu-item pp-has-dropdown">

                <div class="pp-menu-head">

                    <a
                        class="pp-main-link"
                        href="/pool-equipment-brands/"
                    >
                        Brands
                    </a>


                    <button
                        class="pp-arrow-button"
                        type="button"
                        aria-label="Open Brands menu"
                        aria-expanded="false"
                    >
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2.2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        >
                            <path d="m6 9 6 6 6-6"></path>
                        </svg>
                    </button>

                </div>


                <div
                    class="pp-dropdown pp-small-dropdown pp-brand-dropdown"
                    style="display:none;"
                >

                    <div class="pp-small-head">

                        <span class="pp-small-icon">

                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="1.8"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            >
                                <path d="M20.6 13.6 11 4H4v7l9.6 9.6a2 2 0 0 0 2.8 0l4.2-4.2a2 2 0 0 0 0-2.8z"></path>
                                <circle cx="7.5" cy="7.5" r="1"></circle>
                            </svg>

                        </span>


                        <div>

                            <h3 class="pp-small-title">
                                Pool Equipment Brands
                            </h3>

                            <p class="pp-small-text">
                                Service and repair for leading pool equipment manufacturers.
                            </p>

                        </div>

                    </div>


                    <div class="pp-brand-grid">

                        <a
                            class="pp-small-link"
                            href="/hayward-pool-equipment-repair-and-service/"
                        >
                            <span>Hayward</span>
                            <span class="pp-small-arrow">→</span>
                        </a>


                        <a
                            class="pp-small-link"
                            href="/pentair-pool-equipment-repair-and-service/"
                        >
                            <span>Pentair</span>
                            <span class="pp-small-arrow">→</span>
                        </a>


                        <a
                            class="pp-small-link"
                            href="/jandy-pool-equipment-repair-and-service/"
                        >
                            <span>Jandy</span>
                            <span class="pp-small-arrow">→</span>
                        </a>

                    </div>


                    <div class="pp-small-footer">

                        <a href="/pool-equipment-brands/">
                            View all brands →
                        </a>

                    </div>

                </div>

            </li>


            <!-- =====================================================
                 CALL BUTTON
            ====================================================== -->

            <!-----

            <li class="pp-menu-item">

                <a
                    class="pp-call"
                    href="tel:+16028427178"
                >

                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    >
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.62 2.63a2 2 0 0 1-.45 2.11L8 9.73a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.85.29 1.73.5 2.63.62A2 2 0 0 1 22 16.92z"></path>
                    </svg>

                    <span>
                        602-842-7178
                    </span>

                </a>

            </li>   ----->

        </ul>

    </nav>

</div>


<script>
(function () {

    function initPoolPilotsNav() {

        const navWidget = document.getElementById("poolPilotsNav");

        if (!navWidget) {
            return;
        }

        if (navWidget.dataset.ppInitialized === "true") {
            return;
        }

        navWidget.dataset.ppInitialized = "true";


        const mobileButton =
            navWidget.querySelector(".pp-mobile-button");

        const dropdownItems =
            navWidget.querySelectorAll(".pp-has-dropdown");

        const dropdownButtons =
            navWidget.querySelectorAll(".pp-arrow-button");


        function isMobile() {
            return window.innerWidth <= 1024;
        }


        function closeDropdowns(exceptItem) {

            dropdownItems.forEach(function (item) {

                if (item !== exceptItem) {

                    item.classList.remove("pp-open");

                    const button =
                        item.querySelector(".pp-arrow-button");

                    if (button) {
                        button.setAttribute(
                            "aria-expanded",
                            "false"
                        );
                    }

                }

            });

        }


        /* MOBILE BUTTON */

        if (mobileButton) {

            mobileButton.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();
                    event.stopPropagation();

                    const willOpen =
                        !navWidget.classList.contains(
                            "pp-mobile-open"
                        );

                    navWidget.classList.toggle(
                        "pp-mobile-open",
                        willOpen
                    );

                    mobileButton.setAttribute(
                        "aria-expanded",
                        willOpen ? "true" : "false"
                    );

                    if (!willOpen) {
                        closeDropdowns();
                    }

                }
            );

        }


        /* DROPDOWN BUTTONS */

        dropdownButtons.forEach(function (button) {

            button.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();
                    event.stopPropagation();

                    const currentItem =
                        button.closest(".pp-has-dropdown");

                    if (!currentItem) {
                        return;
                    }

                    const willOpen =
                        !currentItem.classList.contains(
                            "pp-open"
                        );

                    closeDropdowns(currentItem);

                    currentItem.classList.toggle(
                        "pp-open",
                        willOpen
                    );

                    button.setAttribute(
                        "aria-expanded",
                        willOpen ? "true" : "false"
                    );

                }
            );

        });


        /* CLICK OUTSIDE */

        document.addEventListener(
            "click",
            function (event) {

                if (!navWidget.contains(event.target)) {

                    closeDropdowns();

                    navWidget.classList.remove(
                        "pp-mobile-open"
                    );

                    if (mobileButton) {

                        mobileButton.setAttribute(
                            "aria-expanded",
                            "false"
                        );

                    }

                }

            }
        );


        /* ESCAPE KEY */

        document.addEventListener(
            "keydown",
            function (event) {

                if (event.key !== "Escape") {
                    return;
                }

                closeDropdowns();

                navWidget.classList.remove(
                    "pp-mobile-open"
                );

                if (mobileButton) {

                    mobileButton.setAttribute(
                        "aria-expanded",
                        "false"
                    );

                }

            }
        );


        /* WINDOW RESIZE */

        window.addEventListener(
            "resize",
            function () {

                if (!isMobile()) {

                    navWidget.classList.remove(
                        "pp-mobile-open"
                    );

                    closeDropdowns();

                    if (mobileButton) {

                        mobileButton.setAttribute(
                            "aria-expanded",
                            "false"
                        );

                    }

                }

            }
        );

    }


    if (document.readyState === "loading") {

        document.addEventListener(
            "DOMContentLoaded",
            initPoolPilotsNav
        );

    } else {

        initPoolPilotsNav();

    }

})();
</script>