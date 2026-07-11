const mapContainer = document.getElementById("map-container");
const dealerList = document.getElementById("dealer-list");
const searchInput = document.getElementById("search-input");

const showAllButton = document.getElementById("show-all");
const showPriorityButton = document.getElementById("show-priority");
const showUnvisitedButton = document.getElementById("show-unvisited");
const showPurchasedButton = document.getElementById("show-purchased");

let currentFilter = "all";

// ------------------------------------
// 保存データ
// ------------------------------------
function getSavedState() {
    const saved = localStorage.getItem("dollBookletState");

    if (!saved) {
        return {};
    }

    try {
        return JSON.parse(saved);
    } catch {
        return {};
    }
}

let savedState = getSavedState();

function saveState() {
    localStorage.setItem(
        "dollBookletState",
        JSON.stringify(savedState)
    );
}

// ------------------------------------
// ディーラーを探す
// ------------------------------------
function findDealer(booth) {
    return dealers.find(dealer => dealer.booth === booth);
}

// ------------------------------------
// ブースボタンを作る
// ------------------------------------
function createBoothButton(booth) {
    const dealer = findDealer(booth);

    const button = document.createElement("button");

    button.className = "map-booth";
    button.textContent = booth.replace("-", "");
    button.dataset.booth = booth;

    if (
        !dealer ||
        (
            !dealer.instagram &&
            !dealer.x_url &&
            !dealer.website
        )
    ) {
        button.classList.add("inactive");
    }

    if (dealer?.priority === "high") {
        button.classList.add("priority");
    }

    if (dealer?.priority === "low") {
        button.classList.add("interest");
    }

    if (savedState[booth]?.visited) {
        button.classList.add("visited");
    }

    if (savedState[booth]?.purchased) {
        button.classList.add("purchased");
    }

    button.onclick = () => {
        const target = document.getElementById(booth);

        if (target) {
            target.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }
    };

    return button;
}

// ------------------------------------
// A・Bブースの横一列
// ------------------------------------
function createBoothRow(start, end, blockName) {
    const row = document.createElement("div");
    row.className = "booth-row";

    for (let number = start; number <= end; number++) {
        const booth =
            `${blockName}-${String(number).padStart(2, "0")}`;

        row.appendChild(createBoothButton(booth));
    }

    return row;
}

// ------------------------------------
// A・Bブロック
// ------------------------------------
function createBlock(
    title,
    topStart,
    topEnd,
    bottomStart,
    bottomEnd
) {
    const block = document.createElement("section");

    block.className =
        `map-block block-${title.toLowerCase()}`;

    block.appendChild(
        createBoothRow(topStart, topEnd, title)
    );

    const label = document.createElement("div");
    label.className = "block-label";
    label.textContent = title;

    block.appendChild(label);

    block.appendChild(
        createBoothRow(bottomStart, bottomEnd, title)
    );

    return block;
}

// ------------------------------------
// 外周ブース
// ------------------------------------
function createOuterBooth(number) {
    return createBoothButton(String(number));
}

function createOuterRow(numbers, className) {
    const row = document.createElement("div");
    row.className = `outer-row ${className}`;

    numbers.forEach(number => {
        row.appendChild(createOuterBooth(number));
    });

    return row;
}

function createOuterColumn(numbers, className) {
    const column = document.createElement("div");
    column.className = `outer-column ${className}`;

    numbers.forEach(number => {
        column.appendChild(createOuterBooth(number));
    });

    return column;
}

// ------------------------------------
// 会場マップ
// ------------------------------------
function renderMap() {
    mapContainer.innerHTML = "";

    mapContainer.appendChild(
        createOuterRow(
            [
                47, 46, 45, 44, 43,
                42, 41, 40, 39, 38,
                37, 36, 35, 34, 33
            ],
            "outer-top"
        )
    );

    const mapMiddle = document.createElement("div");
    mapMiddle.className = "map-middle";

    mapMiddle.appendChild(
        createOuterColumn(
            [48, 1, 2, 3, 4],
            "outer-left"
        )
    );

    const mapCenter = document.createElement("div");
    mapCenter.className = "map-center";

    mapCenter.appendChild(
        createBlock("A", 1, 15, 16, 31)
    );

    mapCenter.appendChild(
        createBlock("A", 32, 49, 50, 64)
    );

    mapCenter.appendChild(
        createBlock("B", 1, 18, 19, 32)
    );

    mapCenter.appendChild(
        createBlock("B", 33, 47, 48, 60)
    );

    mapMiddle.appendChild(mapCenter);

    mapMiddle.appendChild(
        createOuterColumn(
            [
                32, 31, 30, 29,
                28, 27, 26, 25,
                24, 23, 22
            ],
            "outer-right"
        )
    );

    mapContainer.appendChild(mapMiddle);

    mapContainer.appendChild(
        createOuterRow(
            [
                5, 6, 7, 8, 9,
                10, 11, 12, 13,
                14, 15, 16, 17,
                18, 19, 20, 21
            ],
            "outer-bottom"
        )
    );
}

// ------------------------------------
// 表示条件
// ------------------------------------
function shouldShowDealer(dealer) {
    const keyword = searchInput.value
        .trim()
        .toLowerCase();

    const booth = dealer.booth.toLowerCase();
    const name = dealer.name.toLowerCase();

    const matchesSearch =
        booth.includes(keyword) ||
        name.includes(keyword);

    if (!matchesSearch) {
        return false;
    }

    const state = savedState[dealer.booth] || {};

    if (currentFilter === "priority") {
        return dealer.priority === "high";
    }

    if (currentFilter === "unvisited") {
        return !state.visited;
    }

    if (currentFilter === "purchased") {
        return state.purchased === true;
    }

    return true;
}

// ------------------------------------
// ディーラー一覧
// ------------------------------------
function renderDealerList() {
    dealerList.innerHTML = "";

    dealers
        .filter(shouldShowDealer)
        .forEach(dealer => {
            const state = savedState[dealer.booth] || {};

            const card = document.createElement("div");
            card.className = "card";
            card.id = dealer.booth;

            if (state.visited) {
                card.classList.add("visited-card");
            }

            if (state.purchased) {
                card.classList.add("purchased-card");
            }

            card.innerHTML = `
                <h3>
                    ${dealer.priority === "high" ? "❤️" : ""}
                    ${dealer.priority === "low" ? "⭐" : ""}
                    ${dealer.booth}　${dealer.name}
                </h3>

                <div class="status-buttons">

                    <button
                        type="button"
                        class="visited-button"
                        data-booth="${dealer.booth}"
                    >
                        ${state.visited ? "✅ 見た" : "□ 見ていない"}
                    </button>

                    <button
                        type="button"
                        class="purchased-button"
                        data-booth="${dealer.booth}"
                    >
                        ${state.purchased ? "🛒 購入済み" : "🛒 未購入"}
                    </button>

                </div>

                <div class="links">

                    ${
                        dealer.instagram
                            ? `<a href="${dealer.instagram}" target="_blank" rel="noopener noreferrer">📷 Instagram</a>`
                            : ""
                    }

                    ${
                        dealer.x_url
                            ? `<a href="${dealer.x_url}" target="_blank" rel="noopener noreferrer">🐦 X</a>`
                            : ""
                    }

                    ${
                        dealer.website
                            ? `<a href="${dealer.website}" target="_blank" rel="noopener noreferrer">🌐 Website</a>`
                            : ""
                    }

                </div>

                ${
                    dealer.memo
                        ? `<p>${dealer.memo}</p>`
                        : ""
                }
            `;

            dealerList.appendChild(card);
        });

    addStatusButtonEvents();
}

// ------------------------------------
// 見た・購入済みボタン
// ------------------------------------
function addStatusButtonEvents() {
    document
        .querySelectorAll(".visited-button")
        .forEach(button => {
            button.addEventListener("click", () => {
                const booth = button.dataset.booth;

                if (!savedState[booth]) {
                    savedState[booth] = {};
                }

                savedState[booth].visited =
                    !savedState[booth].visited;

                saveState();
                renderMap();
                renderDealerList();
            });
        });

    document
        .querySelectorAll(".purchased-button")
        .forEach(button => {
            button.addEventListener("click", () => {
                const booth = button.dataset.booth;

                if (!savedState[booth]) {
                    savedState[booth] = {};
                }

                savedState[booth].purchased =
                    !savedState[booth].purchased;

                if (savedState[booth].purchased) {
                    savedState[booth].visited = true;
                }

                saveState();
                renderMap();
                renderDealerList();
            });
        });
}

// ------------------------------------
// 検索・フィルター
// ------------------------------------
searchInput.addEventListener("input", renderDealerList);

showAllButton.addEventListener("click", () => {
    currentFilter = "all";
    updateFilterButtons();
    renderDealerList();
});

showPriorityButton.addEventListener("click", () => {
    currentFilter = "priority";
    updateFilterButtons();
    renderDealerList();
});

showUnvisitedButton.addEventListener("click", () => {
    currentFilter = "unvisited";
    updateFilterButtons();
    renderDealerList();
});

showPurchasedButton.addEventListener("click", () => {
    currentFilter = "purchased";
    updateFilterButtons();
    renderDealerList();
});

function updateFilterButtons() {
    document
        .querySelectorAll(".filter-buttons button")
        .forEach(button => {
            button.classList.remove("active-filter");
        });

    if (currentFilter === "all") {
        showAllButton.classList.add("active-filter");
    }

    if (currentFilter === "priority") {
        showPriorityButton.classList.add("active-filter");
    }

    if (currentFilter === "unvisited") {
        showUnvisitedButton.classList.add("active-filter");
    }

    if (currentFilter === "purchased") {
        showPurchasedButton.classList.add("active-filter");
    }
}

// ------------------------------------
// 初期表示
// ------------------------------------
renderMap();
updateFilterButtons();
renderDealerList();