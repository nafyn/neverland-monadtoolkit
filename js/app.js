const groups = {
  DeFi: {
    DEX: [
      { name: "Atlantis", logo: "atlantis" },
      { name: "Bean Exchange", logo: "bean-exchange" },
      { name: "Dirol", logo: "dirol" },
      { name: "Kuru", logo: "kuru" },
      { name: "OctoSwap", logo: "octoswap" },
      { name: "Purps", logo: "purps" },
    ],
    Lending: [
      { name: "Covenant", logo: "covenant" },
      { name: "Modus", logo: "modus" },
      { name: "Neverland", logo: "neverland" },
    ],
    "Liquid Staking": [
      { name: "FastLane", logo: "fastlane" },
      { name: "Kintsu", logo: "kintsu" },
      { name: "Magma", logo: "magma" },
    ],
    Yield: [
      { name: "Accountable", logo: "accountable" },
      { name: "Kansei", logo: "kansei" },
      { name: "Mu Digital", logo: "mu-digital" },
    ],
  },
  Trading: {
    "ve3,3 DEX": [
      { name: "AetheonSwap", logo: "aetheonswap" },
      { name: "Pinot", logo: "pinot" },
      { name: "Swyrl", logo: "swyrl" },
    ],
    Aggregators: [
      { name: "Clober", logo: "clober" },
      { name: "Dirol", logo: "dirol" },
      { name: "Mace", logo: "mace" },
      { name: "Madhouse", logo: "madhouse" },
      { name: "Monorail", logo: "monorail" },
    ],
    Perps: [
      { name: "Drake", logo: "drake" },
      { name: "LeverUp", logo: "leverup" },
      { name: "Narwhal", logo: "narwhal" },
    ],
    "Prediction Markets": [
      { name: "Kizzy", logo: "kizzy" },
      { name: "LevrBet", logo: "levrbet" },
      { name: "RareBetSports", logo: "rarebetsports" },
    ],
  },
  Ecosystem: {
    Social: [
      { name: "Cult", logo: "cult" },
      { name: "Jenius", logo: "jenius" },
    ],
    Launchpad: [
      { name: "Atlantis", logo: "atlantis" },
      { name: "Kuru", logo: "kuru" },
      { name: "Nad.fun", logo: "nad-fun" },
    ],
    "Gaming & AI": [
      { name: "Breath of Estova", logo: "breath-of-estova" },
      { name: "Lumiterra", logo: "lumiterra" },
    ],
  },
};

// Load saved toolkit state on page load
const savedState = localStorage.getItem("toolkitState");
if (savedState) {
  try {
    const parsed = JSON.parse(savedState);
    Object.assign(state, parsed);
  } catch (e) {
    console.error("Failed to load saved state:", e);
  }
}

const app = document.getElementById("app");
const resultCard = document.getElementById("result-card");
const resultContent = document.getElementById("result-content");

let currentStep = 0;
let expandedGroup = "DeFi"; // Start with first group expanded for cleaner UI

// Twitter username handling
const twitterUsernameInput = document.getElementById("twitter-username");
let twitterUsername = localStorage.getItem("twitterUsername") || "";

// Save state to localStorage
function saveState() {
  localStorage.setItem("toolkitState", JSON.stringify(state));
  // Clear the image copied flag since toolkit changed
  localStorage.removeItem("imageCopied");
}

// Clean up expired imageCopied flag on page load
try {
  const copyDataStr = localStorage.getItem("imageCopied");
  if (copyDataStr) {
    const copyData = JSON.parse(copyDataStr);
    const timeDiff = Date.now() - copyData.timestamp;
    // Remove if older than 5 minutes
    if (timeDiff >= 300000) {
      localStorage.removeItem("imageCopied");
    }
  }
} catch (e) {
  // Invalid data, remove it
  localStorage.removeItem("imageCopied");
}

// Load saved username
if (twitterUsername) {
  twitterUsernameInput.value = twitterUsername;
}

// Save username on input
twitterUsernameInput.addEventListener("input", (e) => {
  twitterUsername = e.target.value.trim().replace(/^@/, ""); // Remove @ if user types it
  localStorage.setItem("twitterUsername", twitterUsername);
  twitterUsernameInput.value = twitterUsername; // Update without @
});

function isMobile() {
  return window.matchMedia("(max-width: 768px)").matches;
}

function autoAdvanceGroup() {
  if (isMobile()) return;

  const groupNames = Object.keys(groups);
  const currentGroupIndex = groupNames.indexOf(expandedGroup);

  if (currentGroupIndex === -1) return;

  // Check if current group is completed (at least 1 selection per category)
  const currentGroupCategories = Object.keys(groups[expandedGroup]);
  const currentGroupComplete = currentGroupCategories.every(
    (cat) => state[cat] && state[cat].length >= 1
  );

  if (currentGroupComplete) {
    // Find the first incomplete category in any group
    let foundIncomplete = false;

    for (const [groupName, categories] of Object.entries(groups)) {
      const categoryKeys = Object.keys(categories);
      const hasIncomplete = categoryKeys.some(
        (cat) => !state[cat] || state[cat].length < 1
      );

      if (hasIncomplete) {
        // Found a group with incomplete categories
        expandedGroup = groupName;
        foundIncomplete = true;
        break;
      }
    }

    // If no incomplete categories found, collapse everything (100% complete)
    if (!foundIncomplete) {
      expandedGroup = null;
    }
  }
}

function render() {
  app.innerHTML = "";

  const groupList = Object.entries(groups);
  const flatCategories = groupList.flatMap(([_, cats]) => Object.keys(cats));

  // --- MOBILE STEP MODE ---
  if (isMobile()) {
    // Check if we're on the final "Review" step
    const isReviewStep = currentStep === flatCategories.length;

    if (isReviewStep) {
      // Show toolkit preview - max height but don't force full screen
      const container = document.createElement("div");
      container.className = "flex flex-col";
      container.style.maxHeight = "calc(100vh - 120px)"; // 120px = header + footer + margins

      container.innerHTML = `
        <h2 class="text-xl font-semibold text-center mb-3 flex-shrink-0">My Toolkit</h2>
      `;

      // Build toolkit preview
      const previewContent = document.createElement("div");
      previewContent.className =
        "flex-1 overflow-y-auto space-y-2 bg-[#2a0b52]/50 border border-[#3e2260]/50 rounded-xl p-3 min-h-0";

      let hasSelections = false;
      Object.entries(groups).forEach(([groupName, categories]) => {
        Object.entries(categories).forEach(([category, options]) => {
          const selections = state[category] || [];
          if (selections.length >= 1) {
            hasSelections = true;
            const row = document.createElement("div");
            row.className =
              "flex justify-between items-center py-2 border-b border-white/5 last:border-0";

            const categoryLabel = document.createElement("span");
            categoryLabel.className = "text-white/80 text-sm";
            categoryLabel.textContent = category;

            const appsContainer = document.createElement("div");
            appsContainer.className =
              "flex items-center gap-2 flex-wrap justify-end";

            selections.forEach((name) => {
              const selectedOption = options.find((opt) => opt.name === name);
              if (selectedOption) {
                const logo = document.createElement("img");
                logo.src = `img/brands/${selectedOption.logo}.webp`;
                logo.alt = name;
                logo.title = name;
                logo.className = "w-5 h-5 rounded-full";
                logo.onerror = () => (logo.src = "img/brands/nologo.webp");
                appsContainer.appendChild(logo);
              }
            });

            row.appendChild(categoryLabel);
            row.appendChild(appsContainer);
            previewContent.appendChild(row);
          }
        });
      });

      if (!hasSelections) {
        previewContent.innerHTML =
          '<p class="text-white/40 text-center py-8">No selections yet</p>';
      }

      container.appendChild(previewContent);

      // Twitter username input
      const usernameSection = document.createElement("div");
      usernameSection.className = "mt-3 flex-shrink-0";
      usernameSection.innerHTML = `
        <label class="block text-xs text-white/80 mb-1">Twitter Handle (optional)</label>
        <div class="relative">
          <span class="absolute left-2 top-1/2 -translate-y-1/2 text-white/40 text-md">@</span>
          <input
            type="text"
            id="twitter-username-mobile"
            placeholder="username"
            value="${twitterUsername}"
            class="w-full pl-7 pr-4 py-1.5 text-md bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-[#CF6EDD]/50 focus:bg-white/10 transition-colors"
          />
        </div>
      `;
      container.appendChild(usernameSection);

      // Handle mobile username input
      setTimeout(() => {
        const mobileInput = document.getElementById("twitter-username-mobile");
        if (mobileInput) {
          mobileInput.addEventListener("input", (e) => {
            twitterUsername = e.target.value.trim().replace(/^@/, "");
            localStorage.setItem("twitterUsername", twitterUsername);
            mobileInput.value = twitterUsername;
            // Also update desktop input if it exists
            const desktopInput = document.getElementById("twitter-username");
            if (desktopInput) desktopInput.value = twitterUsername;
          });
        }
      }, 0);

      // Navigation
      const nav = document.createElement("div");
      nav.className = "flex gap-3 mt-4 text-sm flex-shrink-0";
      nav.innerHTML = `
        <button class="flex-1 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium transition-colors px-4 py-2 text-sm bg-gradient-to-b from-[#C757D8]/20 to-[#9A00B2]/20 text-white hover:from-[#CF6EDD]/30 hover:to-[#B500D1]/30">Start Over</button>
        <button class="flex-1 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium transition-colors px-4 py-2 text-sm bg-gradient-to-b from-[#C757D8] to-[#9A00B2] text-white hover:from-[#CF6EDD] hover:to-[#B500D1]">Share ✦</button>
      `;

      nav.children[0].onclick = () => {
        // Clear all selections
        Object.keys(state).forEach((key) => delete state[key]);
        // Reset to first step
        currentStep = 0;
        expandedGroup = "DeFi";
        saveState();
        updateCard();
        render();
      };
      nav.children[1].onclick = () => {
        shareCard();
      };

      container.appendChild(nav);
      app.appendChild(container);

      // Hide progress dots on review step to save space
      const progress = document.getElementById("mobile-progress");
      progress.classList.add("hidden");

      return;
    }

    const categoryName = flatCategories[currentStep];
    const options = groupList.flatMap(([_, cats]) => cats[categoryName] ?? []);

    const container = document.createElement("div");
    container.className = "space-y-4";

    const selectionCount = state[categoryName] ? state[categoryName].length : 0;
    // Dynamic max: 2 options=1, 3 options=2, 3+ options=3
    const maxSelections =
      options.length === 2 ? 1 : options.length === 3 ? 2 : 3;

    // Create intuitive selection status message
    let selectionStatus;
    if (selectionCount === 0) {
      selectionStatus = `<span class="text-white/60">Pick at least 1${
        maxSelections > 1 ? ` (up to ${maxSelections})` : ""
      }</span>`;
    } else {
      selectionStatus = `<span class="text-[#CF6EDD]">✓ ${selectionCount} selected${
        maxSelections > 1 ? ` (max ${maxSelections})` : ""
      }</span>`;
    }

    container.innerHTML = `
      <div class="flex items-center justify-between mb-2">
        <h2 class="text-2xl font-semibold">${categoryName}</h2>
        <span class="text-sm">${selectionStatus}</span>
      </div>
    `;

    const buttons = document.createElement("div");
    buttons.className = "flex flex-col gap-3";

    options.forEach((option) => {
      if (!state[categoryName]) state[categoryName] = [];
      const active = state[categoryName].includes(option.name);
      const selectionCount = state[categoryName].length;
      const isDisabled = !active && selectionCount >= maxSelections;

      const btn = document.createElement("button");
      btn.disabled = isDisabled;
      btn.className = `
        w-full flex items-center gap-3 rounded-xl font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-30 px-4 py-3 text-base
        ${
          active
            ? "bg-gradient-to-b from-[#C757D8] to-[#9A00B2] text-white shadow-md"
            : isDisabled
            ? "bg-gradient-to-b from-white/10 to-white/5 text-white/40 cursor-not-allowed"
            : "bg-gradient-to-b from-[#C757D8]/20 to-[#9A00B2]/20 text-white hover:from-[#CF6EDD]/30 hover:to-[#B500D1]/30 active:from-[#9125A1] active:to-[#9A00B2]"
        }
      `;
      const img = document.createElement("img");
      img.className = "w-8 h-8 rounded-full flex-shrink-0";
      img.src = `img/brands/${option.logo}.webp`;
      img.alt = option.name;
      img.onerror = () => (img.src = "img/brands/nologo.webp");

      const span = document.createElement("span");
      span.className = "flex-1 text-left";
      span.textContent = option.name;

      btn.appendChild(img);
      btn.appendChild(span);
      btn.onclick = () => {
        if (!state[categoryName]) state[categoryName] = [];

        if (active) {
          // Remove from selection
          state[categoryName] = state[categoryName].filter(
            (name) => name !== option.name
          );
          if (state[categoryName].length === 0) delete state[categoryName];
        } else {
          // Add to selection if under limit
          if (selectionCount < maxSelections) {
            state[categoryName].push(option.name);
          }
        }
        saveState();
        updateCard();
        render();
      };
      buttons.appendChild(btn);
    });

    container.appendChild(buttons);

    const nav = document.createElement("div");
    nav.className = "flex gap-3 mt-6 text-sm";

    const hasSelection = selectionCount >= 1;
    const isLastCategory = currentStep === flatCategories.length - 1;
    const nextButtonText = isLastCategory ? "Review" : "Next";

    nav.innerHTML = `
      <button ${
        currentStep === 0 ? "disabled" : ""
      } class="flex-1 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium transition-colors px-4 py-2 text-sm bg-gradient-to-b from-[#C757D8]/20 to-[#9A00B2]/20 text-white hover:from-[#CF6EDD]/30 hover:to-[#B500D1]/30 disabled:opacity-50">Back</button>
      <button ${
        !hasSelection ? "disabled" : ""
      } class="flex-1 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium transition-colors px-4 py-2 text-sm bg-gradient-to-b from-[#C757D8] to-[#9A00B2] text-white hover:from-[#CF6EDD] hover:to-[#B500D1] disabled:opacity-50 disabled:cursor-not-allowed">${nextButtonText}</button>
    `;

    nav.children[0].onclick = () => {
      currentStep--;
      render();
    };
    nav.children[1].onclick = () => {
      if (hasSelection && currentStep < flatCategories.length) currentStep++;
      render();
    };

    container.appendChild(nav);
    app.appendChild(container);

    // Show progress dots on regular steps
    const progress = document.getElementById("mobile-progress");
    progress.classList.remove("hidden");
    progress.innerHTML = flatCategories
      .map(
        (_, i) => `
      <div class="transition-all duration-300 ${
        i === currentStep ? "w-6 bg-[#D767FF]" : "w-2 bg-white/30"
      } h-2 rounded-full"></div>
    `
      )
      .join("");

    return;
  }

  // --- DESKTOP MODE ---
  const mainCard = document.createElement("div");
  mainCard.className =
    "rounded-xl bg-[#2a0b52]/50 border border-[#3e2260]/50 p-6";

  const groupEntries = Object.entries(groups);
  groupEntries.forEach(([groupName, categories], groupIndex) => {
    // Add divider before all groups except the first
    if (groupIndex > 0) {
      const divider = document.createElement("hr");
      divider.className = "border-white/10 my-4";
      mainCard.appendChild(divider);
    }

    const groupSection = document.createElement("div");
    groupSection.className = groupIndex > 0 ? "mt-4" : "";

    // Clickable group header with expand/collapse
    const isExpanded = expandedGroup === groupName;

    // Count completed items in this group (at least 1 selection per category)
    const groupCategories = Object.keys(categories);
    const completedInGroup = groupCategories.filter(
      (cat) => state[cat] && state[cat].length >= 1
    ).length;
    const totalInGroup = groupCategories.length;
    const isGroupComplete = completedInGroup === totalInGroup;
    const hasCompleted = completedInGroup > 0;

    const groupHeader = document.createElement("div");
    groupHeader.className = `flex items-center justify-between ${
      isExpanded ? "cursor-default" : "cursor-pointer hover:bg-white/5"
    } group py-2 px-3 -mx-3 rounded-lg transition-all duration-200 ${
      isExpanded ? "mb-3" : ""
    }`;
    groupHeader.innerHTML = `
      <div class="flex items-center gap-3">
        <h2 class="text-2xl font-semibold text-white/90 group-hover:text-white transition-colors">${groupName}</h2>
        ${
          isGroupComplete
            ? `<span class="text-xs px-2 py-0.5 rounded-full bg-[#c049d2] text-white">✓ Complete</span>`
            : hasCompleted
            ? `<span class="text-xs px-2 py-0.5 rounded-full bg-[#CF6EDD]/20 text-[#CF6EDD] border border-[#CF6EDD]/30">${completedInGroup}/${totalInGroup}</span>`
            : !isExpanded
            ? `<span class="text-xs px-2 py-0.5 rounded-full bg-[#CF6EDD]/20 text-[#CF6EDD] border border-[#CF6EDD]/30">Click to expand</span>`
            : ""
        }
      </div>
      <span class="text-[#CF6EDD] text-sm transform transition-transform duration-300 ${
        isExpanded ? "rotate-90" : ""
      }" style="font-size: 18px;">›</span>
    `;

    groupHeader.onclick = () => {
      // Allow switching to a different group or expanding when all are collapsed
      if (expandedGroup !== groupName) {
        expandedGroup = groupName;
        render();
      }
    };

    groupSection.appendChild(groupHeader);

    // Categories container with collapse animation
    const categoriesContainer = document.createElement("div");
    categoriesContainer.className = `pl-2 transition-all duration-300 overflow-hidden ${
      isExpanded ? "opacity-100 max-h-[2000px]" : "opacity-0 max-h-0"
    }`;

    Object.entries(categories).forEach(([category, options], catIndex) => {
      const categorySection = document.createElement("div");
      categorySection.className = catIndex > 0 ? "mt-5" : "mt-2";

      // Add subtle separator before subcategories (except first)
      const separatorClass =
        catIndex > 0 ? "pt-4 border-t border-white/5 mb-3" : "mb-3";

      const catSelectionCount = state[category] ? state[category].length : 0;
      // Dynamic max: 2 options=1, 3 options=2, 3+ options=3
      const maxSelections =
        options.length === 2 ? 1 : options.length === 3 ? 2 : 3;

      // Create intuitive selection status
      let statusBadge;
      if (catSelectionCount === 0) {
        statusBadge = `<span class="text-xs text-white/50">min 1${
          maxSelections > 1 ? `, up to ${maxSelections}` : ""
        }</span>`;
      } else {
        statusBadge = `<span class="text-xs text-[#CF6EDD]">✓ ${catSelectionCount}${
          maxSelections > 1 ? `/${maxSelections}` : ""
        }</span>`;
      }

      categorySection.innerHTML = `
        <div class="${separatorClass}">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2 pr-16 whitespace-nowrap">
              <h3 class="text-lg font-medium text-white/80 flex items-center gap-2">
                <span class="text-[#CF6EDD] text-xs">✦</span>
                ${category}
              </h3>
              ${statusBadge}
            </div>
            <div class='flex flex-wrap gap-3 justify-end content-start' data-buttons></div>
          </div>
        </div>
      `;
      const buttons = categorySection.querySelector("[data-buttons]");

      options.forEach((option) => {
        if (!state[category]) state[category] = [];
        const chosen = state[category].includes(option.name);
        const selectionCount = state[category].length;
        const isDisabled = !chosen && selectionCount >= maxSelections;

        const btn = document.createElement("button");
        btn.disabled = isDisabled;
        btn.className = `
          inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-30 px-4 py-2.5 text-sm
          ${
            chosen
              ? "bg-gradient-to-b from-[#C757D8] to-[#9A00B2] text-white shadow-md"
              : isDisabled
              ? "bg-gradient-to-b from-white/10 to-white/5 text-white/40 cursor-not-allowed"
              : "bg-gradient-to-b from-[#C757D8]/20 to-[#9A00B2]/20 text-white hover:from-[#CF6EDD]/30 hover:to-[#B500D1]/30 active:from-[#9125A1] active:to-[#9A00B2]"
          }
        `;
        const img = document.createElement("img");
        img.className = "w-5 h-5 rounded-full";
        img.src = `img/brands/${option.logo}.webp`;
        img.alt = option.name;
        img.onerror = () => (img.src = "img/brands/nologo.webp");

        const span = document.createElement("span");
        span.textContent = option.name;

        btn.appendChild(img);
        btn.appendChild(span);
        btn.onclick = () => {
          if (!state[category]) state[category] = [];

          if (chosen) {
            // Remove from selection
            state[category] = state[category].filter(
              (name) => name !== option.name
            );
            if (state[category].length === 0) delete state[category];
          } else {
            // Add to selection if under limit
            if (selectionCount < maxSelections) {
              state[category].push(option.name);
            }
          }
          saveState();
          updateCard();
          render();
        };

        buttons.appendChild(btn);
      });

      categoriesContainer.appendChild(categorySection);
    });

    groupSection.appendChild(categoriesContainer);
    mainCard.appendChild(groupSection);
  });

  app.appendChild(mainCard);
}

function updateCard() {
  let html = "";

  // Calculate total categories
  let totalCategories = 0;
  let completedCategories = 0;

  Object.entries(groups).forEach(([groupName, categories]) => {
    Object.entries(categories).forEach(([category, options]) => {
      totalCategories++;
      const selections = state[category] || [];
      const hasSelections = selections.length >= 1;
      if (hasSelections) completedCategories++;

      // Build display for selected items - logos only
      let displayContent = "";
      if (hasSelections) {
        displayContent = selections
          .map((name) => {
            const selectedOption = options.find((opt) => opt.name === name);
            const logoSrc = selectedOption
              ? `img/brands/${selectedOption.logo}.webp`
              : "";
            return logoSrc
              ? `<img src="${logoSrc}" alt="${name}" title="${name}" class="w-6 h-6 rounded-full" onerror="this.src='img/brands/nologo.webp'">`
              : "";
          })
          .join("");
      } else {
        displayContent = "—";
      }

      html += `
        <div class="flex justify-between items-center group/item hover:bg-white/5 -mx-2 px-2 py-1 rounded transition-colors">
          <span class="text-white/80">${category}</span>
          <div class="flex items-center gap-2">
            <span class="flex items-center gap-2 flex-wrap ${
              hasSelections ? "text-white" : "text-white/20"
            }">
              ${displayContent}
            </span>
            ${
              hasSelections
                ? `<button class="opacity-0 group-hover/item:opacity-100 transition-opacity text-white/40 hover:text-red-400 ml-1" data-category="${category}" data-group="${groupName}" title="Remove all">✕</button>`
                : ""
            }
          </div>
        </div>
      `;
    });
  });

  resultContent.innerHTML = html;

  // Add event listeners for remove buttons
  resultContent.querySelectorAll("button[data-category]").forEach((btn) => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const category = btn.dataset.category;
      const group = btn.dataset.group;

      // Remove from state
      delete state[category];

      // Expand the group this category belongs to
      if (!isMobile()) {
        expandedGroup = group;
      }

      // Save state
      saveState();

      // Update UI
      updateCard();
      render();
    };
  });

  // Always update completion indicators (card always visible on desktop)
  const percentage = Math.round((completedCategories / totalCategories) * 100);
  const completionBar = document.getElementById("completion-bar");
  const completionText = document.getElementById("completion-text");
  const completionPercent = document.getElementById("completion-percent");
  const shareBtn = document.getElementById("share-btn");
  const copyHint = document.getElementById("copy-hint");

  if (completionBar) completionBar.style.width = `${percentage}%`;
  if (completionText)
    completionText.textContent = `${completedCategories}/${totalCategories} completed`;
  if (completionPercent) completionPercent.textContent = `${percentage}%`;

  // Enable share button and copy hint only when all categories are filled (100%)
  const isComplete = percentage === 100;
  if (shareBtn) {
    shareBtn.disabled = !isComplete;
  }
  if (copyHint) {
    if (isComplete) {
      copyHint.classList.remove("hidden");
      resultCard.style.cursor = "pointer";
    } else {
      copyHint.classList.add("hidden");
      resultCard.style.cursor = "default";
    }
  }

  // Add visual effects based on completion
  if (percentage === 100) {
    resultCard.classList.add("completed");
    resultCard.style.borderColor = "rgba(199, 87, 216, 0.6)";
  } else {
    resultCard.classList.remove("completed");
    if (percentage >= 50) {
      resultCard.style.borderColor = "rgba(62, 34, 96, 0.5)";
      resultCard.style.boxShadow = "0 0 20px rgba(199, 87, 216, 0.2)";
    } else {
      resultCard.style.borderColor = "rgba(62, 34, 96, 0.5)";
      resultCard.style.boxShadow = "";
    }
  }
}

// --- DESKTOP CLICK-TO-COPY ---
if (!isMobile()) {
  resultCard.style.cursor = "default"; // Will change to pointer at 100%

  resultCard.addEventListener("click", async (e) => {
    if (e.target.id === "share-btn" || e.target.id === "clear-btn") return;
    if (e.target.closest("#clear-btn") || e.target.closest("#share-btn"))
      return;

    // Only allow copy if toolkit is 100% complete
    const copyHint = document.getElementById("copy-hint");
    if (copyHint && copyHint.classList.contains("hidden")) return;

    try {
      // Show generating state
      const originalText = copyHint.textContent;
      copyHint.textContent = "Generating...";
      copyHint.style.color = "rgba(207, 110, 221, 0.8)";

      // Use the same canvas generation as share button
      const canvas = await generateToolkitCanvas();

      const blob = await new Promise((res) => canvas.toBlob(res, "image/png"));
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);

      // Show copied state
      copyHint.textContent = "Copied ✓";
      copyHint.style.color = "rgba(207, 110, 221, 1)";

      // Mark that user has copied the image with timestamp and toolkit state
      const copyData = {
        timestamp: Date.now(),
        toolkitHash: JSON.stringify(state), // Hash of current selections
      };
      localStorage.setItem("imageCopied", JSON.stringify(copyData));

      // Reset after 2 seconds
      setTimeout(() => {
        copyHint.textContent = originalText;
        copyHint.style.color = "";
      }, 2000);
    } catch (err) {
      console.error(err);
      copyHint.textContent = "Failed to copy";
      copyHint.style.color = "rgba(255, 100, 100, 0.8)";
      setTimeout(() => {
        copyHint.textContent = "Click to copy";
        copyHint.style.color = "";
      }, 2000);
    }
  });
}

// Generate canvas image with toolkit selections
async function generateToolkitCanvas() {
  const temp = document.createElement("div");
  temp.style.position = "absolute";
  temp.style.left = "-99999px";
  temp.style.top = "0";
  temp.style.width = "1000px";
  temp.style.height = "1200px";
  temp.style.padding = "60px";
  temp.style.boxSizing = "border-box";
  temp.style.display = "flex";
  temp.style.flexDirection = "column";
  temp.style.justifyContent = "space-between";
  temp.style.background =
    "linear-gradient(116deg, #200041, #10002C 50%, #2E0958)";
  temp.style.fontFamily = "'Quicksand', sans-serif";
  temp.style.color = "white";

  // Top: Header with Neverland full logo and toolkit subtext
  const header = document.createElement("div");
  header.style.display = "flex";
  header.style.flexDirection = "column";
  header.style.alignItems = "center";
  header.style.justifyContent = "center";
  header.style.gap = "20px";

  // Neverland full logo
  const logoSection = document.createElement("div");
  logoSection.style.display = "flex";
  logoSection.style.justifyContent = "center";
  logoSection.innerHTML = `
    <img src="img/neverland_full.png" alt="Neverland" style="height: 80px; width: auto; display: block;">
  `;

  // Monad toolkit subtext
  const toolkitSection = document.createElement("div");
  toolkitSection.style.fontFamily = "'Cinzel', serif";
  toolkitSection.style.fontSize = "28px";
  toolkitSection.style.fontWeight = "300";
  toolkitSection.style.letterSpacing = "0.05em";
  toolkitSection.style.color = "white";
  toolkitSection.style.textAlign = "center";
  toolkitSection.innerHTML = `<span style="font-family: 'Cinzel Decorative', serif;">M</span>y <span style="font-family: 'Cinzel Decorative', serif;">M</span>onad - <span style="font-family: 'Cinzel Decorative', serif;">N</span>ative <span style="font-family: 'Cinzel Decorative', serif;">D</span>ay 1 <span style="font-family: 'Cinzel Decorative', serif;">T</span>oolkit`;

  header.appendChild(logoSection);
  header.appendChild(toolkitSection);
  temp.appendChild(header);

  // Middle: Categories and selections
  const contentContainer = document.createElement("div");
  contentContainer.style.flex = "1";
  contentContainer.style.display = "flex";
  contentContainer.style.flexDirection = "column";
  contentContainer.style.justifyContent = "center";
  contentContainer.style.gap = "22px";
  contentContainer.style.marginTop = "50px";
  contentContainer.style.marginBottom = "50px";

  // Build categories
  Object.entries(groups).forEach(([groupName, categories]) => {
    Object.entries(categories).forEach(([category, options]) => {
      const selections = state[category] || [];
      if (selections.length >= 1) {
        const categoryRow = document.createElement("div");
        categoryRow.style.display = "flex";
        categoryRow.style.alignItems = "center";
        categoryRow.style.gap = "20px";
        categoryRow.style.fontSize = "22px";

        // Category name container for proper vertical centering
        const categoryContainer = document.createElement("div");
        categoryContainer.style.minWidth = "220px";
        categoryContainer.style.display = "flex";
        categoryContainer.style.alignItems = "center";
        categoryContainer.style.height = "32px"; // Match logo height

        const categoryName = document.createElement("span");
        categoryName.textContent = category + ":";
        categoryName.style.fontFamily = "'Quicksand', sans-serif";
        categoryName.style.fontWeight = "600";
        categoryName.style.color = "white";
        categoryName.style.fontSize = "22px";

        categoryContainer.appendChild(categoryName);
        categoryRow.appendChild(categoryContainer);

        // Apps with logos
        const appsContainer = document.createElement("div");
        appsContainer.style.display = "flex";
        appsContainer.style.alignItems = "center";
        appsContainer.style.gap = "24px";
        appsContainer.style.flexWrap = "wrap";

        selections.forEach((name, index) => {
          const selectedOption = options.find((opt) => opt.name === name);
          if (selectedOption) {
            const appItem = document.createElement("div");
            appItem.style.display = "flex";
            appItem.style.alignItems = "center";
            appItem.style.gap = "10px";

            // Logo
            const logo = document.createElement("img");
            logo.src = `img/brands/${selectedOption.logo}.webp`;
            logo.alt = name;
            logo.style.width = "32px";
            logo.style.height = "32px";
            logo.style.borderRadius = "50%";
            logo.style.marginTop = "22px";
            appItem.appendChild(logo);

            // Name
            const appName = document.createElement("span");
            appName.textContent = name;
            appName.style.color = "white";
            appName.style.fontWeight = "500";
            appName.style.fontSize = "22px";
            appItem.appendChild(appName);

            appsContainer.appendChild(appItem);
          }
        });

        categoryRow.appendChild(appsContainer);
        contentContainer.appendChild(categoryRow);
      }
    });
  });

  temp.appendChild(contentContainer);

  // Bottom: Username or default text
  const footer = document.createElement("div");
  footer.style.textAlign = "center";
  footer.style.fontSize = "20px";
  footer.style.color = "white";
  footer.style.fontWeight = "600";
  footer.textContent = twitterUsername
    ? `Created by @${twitterUsername}`
    : "Created on Neverland";
  temp.appendChild(footer);

  document.body.appendChild(temp);

  const canvas = await html2canvas(temp, {
    backgroundColor: null,
    width: 1000,
    height: 1200,
    scale: 1,
    useCORS: true,
    allowTaint: true,
    logging: false,
  });
  document.body.removeChild(temp);

  return canvas;
}

async function shareCard() {
  const mobileScreen = document.getElementById("mobile-save-screen");
  const mobileImage = document.getElementById("mobile-save-image");
  const closeBtn = document.getElementById("mobile-close");
  const shareBtn = document.getElementById("share-btn");

  // Check if user already copied the image and it's still valid
  let hasImageCopied = false;
  try {
    const copyDataStr = localStorage.getItem("imageCopied");
    if (copyDataStr) {
      const copyData = JSON.parse(copyDataStr);
      const currentTime = Date.now();
      const timeDiff = currentTime - copyData.timestamp;
      const currentToolkitHash = JSON.stringify(state);

      // Image is considered valid if:
      // 1. It was copied within the last 5 minutes (300000ms)
      // 2. The toolkit hasn't changed since copying
      const isRecent = timeDiff < 300000; // 5 minutes
      const isUnchanged = copyData.toolkitHash === currentToolkitHash;

      hasImageCopied = isRecent && isUnchanged;

      // If it's expired or changed, remove the flag
      if (!hasImageCopied) {
        localStorage.removeItem("imageCopied");
      }
    }
  } catch (e) {
    // Invalid data, remove it
    localStorage.removeItem("imageCopied");
  }

  // Show loading state
  const originalText = shareBtn.innerHTML;
  shareBtn.disabled = true;
  shareBtn.innerHTML = `
    <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    <span>Generating...</span>
  `;

  try {
    const tweetText = `This is my Monad Mainnet Toolkit. Day 1 is gonna be a movie ✦ Make yours here: https://toolkit.neverland.money`;
    const tweetUrl =
      "https://twitter.com/intent/tweet?text=" + encodeURIComponent(tweetText);

    // If user already copied the image, skip the save prompt and go directly to Twitter
    if (hasImageCopied) {
      // Reset the flag for next time
      localStorage.removeItem("imageCopied");

      // Restore button state
      shareBtn.innerHTML = originalText;
      shareBtn.disabled = false;

      // Open Twitter directly
      window.open(tweetUrl, "_blank");
      return;
    }

    // Generate canvas
    const canvas = await generateToolkitCanvas();
    const dataUrl = canvas.toDataURL("image/png");
    mobileImage.src = dataUrl;
    mobileScreen.classList.remove("hidden");

    // Restore button state
    shareBtn.innerHTML = originalText;
    shareBtn.disabled = false;

    const cancelBtn = document.getElementById("mobile-cancel");
    const confirmModal = document.getElementById("confirm-modal");
    const confirmYes = document.getElementById("confirm-yes");
    const confirmNo = document.getElementById("confirm-no");

    // Add download functionality on image click
    mobileImage.onclick = () => {
      const link = document.createElement("a");
      link.download = "my-monad-toolkit.png";
      link.href = dataUrl;
      link.click();
    };

    cancelBtn.onclick = () => {
      mobileScreen.classList.add("hidden");
      // Reset the flag so they'll be asked again next time
      localStorage.removeItem("imageCopied");
    };

    closeBtn.onclick = () => {
      // Show custom confirmation modal
      confirmModal.classList.remove("hidden");
    };

    // Handle confirmation modal buttons
    confirmYes.onclick = () => {
      confirmModal.classList.add("hidden");
      mobileScreen.classList.add("hidden");
      // Reset the flag so they'll be asked again next time
      localStorage.removeItem("imageCopied");
      window.open(tweetUrl, "_blank");
    };

    confirmNo.onclick = () => {
      confirmModal.classList.add("hidden");
      // User stays on save screen
    };
  } catch (error) {
    console.error("Error generating canvas:", error);
    // Restore button state on error
    shareBtn.innerHTML = originalText;
    shareBtn.disabled = false;
    alert("Failed to generate image. Please try again.");
  }
}

// Clear button functionality
document.getElementById("clear-btn").onclick = () => {
  // Clear all selections
  Object.keys(state).forEach((key) => delete state[key]);

  // Reset to first group
  expandedGroup = "DeFi";

  // Save cleared state
  saveState();

  // Update UI
  updateCard();
  render();
};

document.getElementById("share-btn").onclick = shareCard;
render();
updateCard(); // Initialize card with all categories on load
