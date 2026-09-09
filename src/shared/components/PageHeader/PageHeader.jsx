import "./PageHeader.css";

function PageHeader({
    title,
    breadcrumbs = [],
    icon: Icon,
    tabs = [],
    activeTab,
    onTabChange
}) {
    return (
        <section className="page-header">
            <div className="page-header__container">
                <div className="page-header__content">
                    {Icon && (
                        <div className="page-header__icon">
                            <Icon />
                        </div>
                    )}

                    <div className="page-header__text">
                        <h1 className="page-header__title">{title}</h1>

                        <nav className="page-header__breadcrumbs" aria-label="breadcrumb">
                            {breadcrumbs.map((item, index) => {
                                const isLast = index === breadcrumbs.length - 1;

                                return (
                                    <span
                                        className="page-header__breadcrumb-item"
                                        key={`${item}-${index}`}
                                    >
                                        <span
                                            className={
                                                isLast
                                                    ? "page-header__breadcrumb-text page-header__breadcrumb-text--current"
                                                    : "page-header__breadcrumb-text"
                                            }
                                        >
                                            {item}
                                        </span>

                                        {!isLast && (
                                            <span
                                                className="page-header__separator"
                                                aria-hidden="true"
                                            >
                                                /
                                            </span>
                                        )}
                                    </span>
                                );
                            })}
                        </nav>
                    </div>
                </div>

                {tabs && tabs.length > 0 && (
                    <div className="page-header__tabs">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                className={`page-header__tab-btn ${
                                    activeTab === tab.id ? "page-header__tab-btn--active" : ""
                                }`}
                                onClick={() => onTabChange && onTabChange(tab.id)}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}

export default PageHeader;
