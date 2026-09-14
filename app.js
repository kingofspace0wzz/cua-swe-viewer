(() => {
  "use strict";

  const sourceAudit = window.CORPUS_AUDIT;
  const gameCollection = window.GAME_CUA_TASKS || { tasks: [], summary: {} };
  const mediaIndex = window.TRAJECTORY_MEDIA || { tasks: {}, summary: {} };
  const activityIndex = window.AGENT_ACTIVITY || { tasks: {}, summary: {} };
  if (!sourceAudit || !Array.isArray(sourceAudit.tasks)) {
    document.body.textContent = "Corpus audit data is unavailable.";
    return;
  }
  const gameTasks = Array.isArray(gameCollection.tasks)
    ? gameCollection.tasks.map((task) => ({
        ...task,
        domain: "game",
        difficulty_band: task.difficulty_band || (task.cua === "pass" ? "easy" : "frontier"),
        is_game_cua: true,
      }))
    : [];
  const audit = {
    ...sourceAudit,
    tasks: [
      ...sourceAudit.tasks
        .filter((task) => task.recommendation !== "remove_redundant")
        .map((task) => {
          const isMobile = String(task.task_id).startsWith("mobile.");
          return {
            ...task,
            domain: isMobile ? "mobile" : "web",
            difficulty_band: task.cua === "pass" ? "easy" : "frontier",
            is_game_cua: false,
            is_mobile_cua: isMobile,
          };
        }),
      ...gameTasks,
    ],
  };

  const state = {
    scope: "all",
    search: "",
    generation: "",
    result: "",
    role: "",
    selectedTaskId: null,
    compareIds: new Set(),
  };

  const els = {
    list: document.querySelector("#taskList"),
    rows: document.querySelector("#taskRows"),
    stage: document.querySelector("#taskStage"),
    search: document.querySelector("#searchInput"),
    generation: document.querySelector("#generationFilter"),
    result: document.querySelector("#resultFilter"),
    role: document.querySelector("#roleFilter"),
    visibleCount: document.querySelector("#visibleCount"),
    filterSummary: document.querySelector("#filterSummary"),
    compareBar: document.querySelector("#compareBar"),
    compareCount: document.querySelector("#compareCount"),
    openCompare: document.querySelector("#openCompare"),
    compareDialog: document.querySelector("#compareDialog"),
    compareGrid: document.querySelector("#compareGrid"),
  };

  const escapeHtml = (value) =>
    String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const humanize = (value) =>
    String(value || "unknown")
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());

  const badge = (label, style) =>
    `<span class="badge badge-${style}">${escapeHtml(label)}</span>`;

  const resultBadge = (value) => {
    if (value === "pass") return badge("Pass", "pass");
    if (value === "fail") return badge("Fail", "fail");
    return badge(humanize(value), "unknown");
  };

  const difficultyBadge = (task) =>
    badge(humanize(task.difficulty_band), task.difficulty_band);

  const scopeBadge = (task) => {
    const labels = {
      primary_keep: ["Primary", "primary"],
      calibration_keep: ["Calibration", "calibration"],
      diagnostic_keep: ["Diagnostic", "diagnostic"],
      game_cua: ["Game CUA", "game-cua"],
      mobile_keep: ["Mobile CUA", "mobile"],
      remove_redundant: ["Remove", "remove"],
    };
    const [label, style] = labels[task.recommendation] || ["Unknown", "unknown"];
    return badge(label, style);
  };

  const githubFileRoot =
    "https://github.com/kingofspace0wzz/cua-swe/blob/main/";
  const publicExport = Boolean(window.PUBLIC_VIEWER_EXPORT);
  const relativeLink = (path) =>
    path.startsWith("viewer/")
      ? encodeURI(path.slice("viewer/".length))
      : window.location.protocol === "file:"
        ? `../${encodeURI(path)}`
        : `${githubFileRoot}${encodeURI(path)}`;

  function taskMedia(taskId) {
    return mediaIndex.tasks?.[taskId] || {
      gold: { status: "unavailable", reason: "No gold replay recording is registered." },
      agent: { status: "unavailable", reason: "No formal agent screenshot sequence is registered." },
    };
  }

  function taskActivity(task) {
    const published = activityIndex.tasks?.[task.task_id];
    if (published) return published;
    return {
      status: "unavailable",
      coverage: "gui_only",
      reason: task.is_game_cua
        ? "The exact scored run's Codex event stream was not copied into the viewer bundle. Only its verified GUI screenshots and visual actions are retained."
        : task.is_mobile_cua
          ? "The retained Mobile evidence contains the formal screenshot-only CUA trajectory and exact visual observations. A separate full coding transcript was not retained for this run."
          : "The historical Web publication retained screenshots, patches, verifier reports, and visual trajectories, while the base64-heavy Codex stdout remained on the execution host and is not part of this viewer bundle.",
    };
  }

  function hasMedia(entry) {
    return Boolean(entry?.status === "available" && entry.video);
  }

  function mediaCoverage(task) {
    const media = taskMedia(task.task_id);
    return Number(hasMedia(media.gold)) + Number(hasMedia(media.agent));
  }

  function evaluationCoverage(task) {
    if (task.is_game_cua) {
      const scorable = Number(task.evaluation?.scorable_rows || 0);
      const total = Number(task.evaluation?.total_rows || 0);
      return {
        label: `${scorable}/${total}`,
        ready: total > 0 && scorable === total,
      };
    }
    const coverage = mediaCoverage(task);
    return { label: `${coverage}/2`, ready: coverage === 2 };
  }

  function filteredTasks() {
    const query = state.search.trim().toLowerCase();
    return audit.tasks.filter((task) => {
      if (state.scope !== "all" && task.domain !== state.scope) return false;
      if (state.generation && task.generation !== state.generation) return false;
      if (state.result && task.difficulty_band !== state.result) return false;
      if (state.role && task.recommendation !== state.role) return false;
      if (!query) return true;
      return [
        task.task_id,
        task.source_repo,
        task.product_domain,
        task.framework,
        task.ui_surface,
        task.discovery_pattern,
        task.bug_mechanism,
        task.classification,
        task.confirmation_status,
        task.instruction,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }

  function keepSelectionInView(tasks) {
    if (!tasks.length) {
      state.selectedTaskId = null;
      return;
    }
    if (!tasks.some((task) => task.task_id === state.selectedTaskId)) {
      state.selectedTaskId = tasks[0].task_id;
    }
  }

  function renderTaskList() {
    const tasks = filteredTasks();
    keepSelectionInView(tasks);
    els.list.innerHTML = tasks
      .map((task) => `
        <button
          type="button"
          class="task-option ${state.selectedTaskId === task.task_id ? "is-active" : ""}"
          data-task-id="${escapeHtml(task.task_id)}"
          role="option"
          aria-selected="${state.selectedTaskId === task.task_id}"
        >
          <span>
            <strong>${escapeHtml(task.task_id)}</strong>
            <span>${escapeHtml(task.source_repo)} · ${escapeHtml(task.domain.toUpperCase())}</span>
          </span>
          <em>${escapeHtml(task.difficulty_band)}</em>
        </button>`)
      .join("");
    els.visibleCount.textContent = `${tasks.length} task${tasks.length === 1 ? "" : "s"}`;
    els.list.querySelectorAll("[data-task-id]").forEach((button) => {
      button.addEventListener("click", () => {
        state.selectedTaskId = button.dataset.taskId;
        renderTaskList();
        renderRows();
        renderStage();
      });
    });
  }

  function factRows(task) {
    const rows = [
      ["Domain", humanize(task.domain)],
      ["Difficulty", humanize(task.difficulty_band)],
      ["Collection", task.collection],
      ["Lineage", task.lineage_group],
      ["Source", task.source_repo],
      ["Framework", humanize(task.framework)],
      ["UI surface", humanize(task.ui_surface)],
      ["Discovery", humanize(task.discovery_pattern)],
      ["Mechanism", humanize(task.bug_mechanism)],
      ["Patch", humanize(task.patch_topology)],
    ];
    if (task.is_game_cua) {
      rows.push(
        ["Confirmation", humanize(task.confirmation_status)],
        ["Model", task.evaluation?.model],
        ["Scorable rows", `${task.evaluation?.scorable_rows}/${task.evaluation?.total_rows}`],
      );
    }
    return rows
      .map(([label, value]) => `<dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd>`)
      .join("");
  }

  function renderGameEvidence(task) {
    const evaluation = task.evaluation || {};
    const codeAttempts = Number(evaluation.code_only_attempts || 0);
    const cuaAttempts = Number(evaluation.cua_attempts || 0);
    const delta = evaluation.delta_cua == null
      ? null
      : `${Math.round(Number(evaluation.delta_cua) * 100)}%`;
    return `
      <div class="game-evidence" aria-label="Matched evaluation evidence">
        <article>
          <span>Code-only success</span>
          <strong>${escapeHtml(evaluation.code_only_successes)}/${escapeHtml(codeAttempts)}</strong>
          <p>GPT-5.6 Sol without browser or gameplay capability.</p>
        </article>
        <article>
          <span>CUA success</span>
          <strong>${escapeHtml(evaluation.cua_successes)}/${escapeHtml(cuaAttempts)}</strong>
          <p>Matched GPT-5.6 Sol runs with computer-use capability.</p>
        </article>
        <article>
          <span>${delta ? "Matched CUA advantage" : "Evaluation integrity"}</span>
          <strong>${escapeHtml(delta || `${evaluation.scorable_rows}/${evaluation.total_rows}`)}</strong>
          <p>${delta
            ? "Difference between CUA and code-only success rates."
            : "All protected evaluation rows were scorable."}</p>
        </article>
      </div>
      ${evaluation.evidence_scope ? `<p class="activity-relation-note">${escapeHtml(evaluation.evidence_scope)}</p>` : ""}`;
  }

  function renderMediaPanel(kind, entry) {
    const title = kind === "gold"
      ? "Gold reference replay"
      : "Computer-use replay · GUI only";
    const label = hasMedia(entry)
      ? `${entry.frame_count || "?"} frames · ${entry.duration_sec || "?"}s`
      : entry.status === "invalid_contract"
        ? "Invalid historical contract"
        : "Evidence unavailable";
    const unavailableTitle = {
      invalid_contract: "Gold contract invalid",
      missing_source: "Source artifact missing",
      unavailable: "Recording unavailable",
    }[entry.status] || "Recording unavailable";
    const content = hasMedia(entry)
      ? `<video controls playsinline preload="metadata" ${entry.poster ? `poster="${escapeHtml(entry.poster)}"` : ""}>
          <source src="${escapeHtml(entry.video)}" type="video/mp4">
          Video playback is not supported by this browser.
        </video>`
      : `<div class="media-unavailable">
          <strong>${escapeHtml(unavailableTitle)}</strong>
          <p>${escapeHtml(entry.reason || "No verified frame sequence is registered for this run.")}</p>
        </div>`;
    const provenance = hasMedia(entry)
      ? `${entry.provenance || "verified_frames"} · ${entry.source || "source recorded in manifest"}`
      : `${entry.recovery || "Register the verified screenshot directory in viewer/media/sources.yaml."}`;
    const scopeNote = kind === "agent" && hasMedia(entry)
      ? `<p class="media-scope-note">This MP4 contains only browser/game screenshots. Terminal commands, code edits, and test runs are shown separately below when the exact agent event stream was retained.</p>`
      : "";
    const trajectoryLink = hasMedia(entry) && entry.trajectory
      ? `<a href="${relativeLink(entry.trajectory)}" target="_blank" rel="noreferrer">Trajectory JSONL</a>`
      : "";
    const artifactLinks = kind === "agent" && entry.artifacts
      ? [
          ["Trajectory JSONL", "agent/trajectory.jsonl"],
          ["Run metadata", "agent/run-result.json"],
          ["Verifier report", "agent/verifier-report.json"],
          ["Agent patch", "agent/patch.diff"],
          ["Matched results", "evaluation-summary.json"],
          ["Representative run", "metadata.json"],
        ]
          .map(([label, path]) => `<a href="${relativeLink(`${entry.artifacts}/${path}`)}" target="_blank" rel="noreferrer">${label}</a>`)
          .join("")
      : "";
    return `
      <section class="media-panel">
        <div class="media-heading"><strong>${title}</strong><span>${escapeHtml(label)}</span></div>
        <div class="media-frame">${content}</div>
        <div class="media-meta">${escapeHtml(provenance)}</div>
        ${scopeNote}
        ${trajectoryLink || artifactLinks ? `<div class="media-links">${trajectoryLink}${artifactLinks}</div>` : ""}
      </section>`;
  }

  function activityKindLabel(kind) {
    const labels = {
      agent_message: "Agent update",
      analysis: "Agent update",
      plan: "Plan",
      command: "Shell",
      edit: "Code edit",
      computer_use: "Computer use",
    };
    return labels[kind] || humanize(kind);
  }

  function renderActivityEvent(event) {
    const detail = event.detail
      ? `<details class="activity-detail">
          <summary>Show ${event.kind === "command" ? "output" : "detail"}</summary>
          <pre>${escapeHtml(event.detail)}</pre>
        </details>`
      : "";
    const exit = event.exit_code == null ? "" : ` · exit ${event.exit_code}`;
    return `
      <li class="activity-event activity-${escapeHtml(event.kind)}">
        <span class="activity-sequence">${escapeHtml(event.sequence)}</span>
        <div>
          <div class="activity-event-heading">
            <strong>${escapeHtml(event.title)}</strong>
            <span>${escapeHtml(activityKindLabel(event.kind))} · ${escapeHtml(event.status)}${escapeHtml(exit)}</span>
          </div>
          ${detail}
        </div>
      </li>`;
  }

  function renderAgentActivity(task) {
    const activity = taskActivity(task);
    if (activity.status !== "available") {
      return `
        <section class="agent-activity agent-activity-unavailable" aria-label="Full agent activity">
          <div class="activity-header">
            <div>
              <p class="section-kicker">Full agent run</p>
              <h4>Coding transcript unavailable</h4>
            </div>
            <span class="activity-coverage">GUI evidence only</span>
          </div>
          <p>${escapeHtml(activity.reason)}</p>
          <p>The viewer does not reconstruct terminal or editing actions from the final patch because that would not be the original trajectory.</p>
        </section>`;
    }
    const summary = activity.summary || {};
    const events = Array.isArray(activity.events) ? activity.events : [];
    const replacement = activity.run_relation === "replacement";
    const compact = activity.coverage === "full_codex_event_stream_compact";
    const failedRun = activity.terminal_status === "failed";
    return `
      <section class="agent-activity" aria-label="Full agent activity">
        <div class="activity-header">
          <div>
            <p class="section-kicker">Full agent run</p>
              <h4>Coding + computer-use event stream</h4>
            </div>
          <span class="activity-coverage">${replacement ? "Replacement rerun" : compact ? "Historical exact · compact" : "Historical exact run"}</span>
        </div>
        <div class="activity-summary">
          <span><strong>${escapeHtml(summary.commands || 0)}</strong> shell commands</span>
          <span><strong>${escapeHtml(summary.file_changes || 0)}</strong> edit events</span>
          <span><strong>${escapeHtml(summary.computer_use_calls || 0)}</strong> computer-use calls</span>
          <span><strong>${escapeHtml(summary.agent_messages || 0)}</strong> agent updates</span>
        </div>
        <p class="activity-provenance">${escapeHtml(activity.provenance || "retained_agent_event_stream")} · ${escapeHtml(activity.source || activity.run_label || "source recorded in task artifact bundle")}</p>
        ${replacement
          ? '<p class="activity-relation-note">This is a fresh rerun of the same task and CUA condition. It is a complete agent transcript, but it is not synchronized to the adjacent historical GUI replay.</p>'
          : ""}
        ${failedRun
          ? `<p class="activity-relation-note">The agent run terminated with an error after the events shown below: ${escapeHtml(activity.terminal_error || "unspecified agent error")}.</p>`
          : ""}
        <details class="activity-timeline-wrap" open>
          <summary>Complete ordered activity · ${escapeHtml(events.length)} events</summary>
          <ol class="activity-timeline">${events.map(renderActivityEvent).join("")}</ol>
        </details>
      </section>`;
  }

  function renderStage() {
    const task = audit.tasks.find((row) => row.task_id === state.selectedTaskId);
    if (!task) {
      els.stage.innerHTML = `<div class="stage-empty"><p class="section-kicker">No matching tasks</p><h3>Adjust the filters.</h3></div>`;
      return;
    }
    const media = taskMedia(task.task_id);
    const appAction = task.app_file
      ? `<a class="button" href="${relativeLink(task.app_file)}" target="_blank" rel="noreferrer">${publicExport ? "Fixture source · repo access" : "Open fixture"}</a>`
      : "";
    const taskAction = task.task_file
      ? `<a class="button" href="${relativeLink(task.task_file)}" target="_blank" rel="noreferrer">Task YAML${publicExport ? " · repo access" : ""}</a>`
      : "";
    const evidenceAction = task.evidence_file
      ? `<a class="button" href="${publicExport ? `data/${task.is_game_cua ? "game-cua-tasks" : "corpus-audit"}.json` : relativeLink(task.evidence_file)}" target="_blank" rel="noreferrer">Evidence inventory</a>`
      : "";
    els.stage.innerHTML = `
      <div class="stage-header">
        <div>
          <p class="section-kicker">${escapeHtml(task.domain.toUpperCase())} · ${escapeHtml(humanize(task.difficulty_band))}</p>
          <h3>${escapeHtml(task.task_id)}</h3>
          <div class="tag-row">
            ${badge(humanize(task.domain), task.domain)}
            ${difficultyBadge(task)}
            ${scopeBadge(task)}
            <span class="tag ${task.code_only === "fail" ? "tag-fail" : ""}">Code-only ${escapeHtml(task.code_only)}</span>
            <span class="tag ${task.cua === "pass" ? "tag-pass" : "tag-fail"}">CUA ${escapeHtml(task.cua)}</span>
          </div>
        </div>
        <div class="stage-actions">
          ${taskAction}
          ${evidenceAction}
          ${appAction}
        </div>
      </div>
      <div class="media-grid">
        ${renderMediaPanel("gold", media.gold)}
        ${renderMediaPanel("agent", media.agent)}
      </div>
      ${renderAgentActivity(task)}
      ${task.is_game_cua ? renderGameEvidence(task) : ""}
      <div class="instruction-block">
        <h4>Task instruction</h4>
        <p>${escapeHtml(task.instruction)}</p>
      </div>
      <div class="evidence-grid">
        <section>
          <h4>Curation decision</h4>
          <ul>${task.reasons.map((reason) => `<li>${escapeHtml(reason)}</li>`).join("")}</ul>
        </section>
        <section>
          <h4>Audit dimensions</h4>
          <dl class="facts">${factRows(task)}</dl>
        </section>
      </div>`;
  }

  function renderRows() {
    const tasks = filteredTasks();
    els.rows.innerHTML = tasks
      .map((task) => {
        const checked = state.compareIds.has(task.task_id) ? "checked" : "";
        const selected = state.selectedTaskId === task.task_id ? "is-selected" : "";
        const coverage = evaluationCoverage(task);
        return `
          <tr data-task-id="${escapeHtml(task.task_id)}" class="${selected}">
            <td class="compare-cell"><input type="checkbox" aria-label="Compare ${escapeHtml(task.task_id)}" ${checked}></td>
            <td class="task-cell"><strong>${escapeHtml(task.task_id)}</strong><span>${escapeHtml(task.product_domain)}</span></td>
            <td>${badge(humanize(task.domain), task.domain)}</td>
            <td>${difficultyBadge(task)}</td>
            <td>${scopeBadge(task)}</td>
            <td>${resultBadge(task.code_only)}</td>
            <td>${resultBadge(task.cua)}</td>
            <td class="task-cell"><strong>${escapeHtml(task.source_repo)}</strong></td>
            <td><span class="media-count ${coverage.ready ? "media-count-ready" : "media-count-missing"}">${escapeHtml(coverage.label)}</span></td>
          </tr>`;
      })
      .join("");

    const filters = [
      state.scope === "all" ? "All domains" : `${humanize(state.scope)} domain`,
      state.generation ? state.generation.toUpperCase() : null,
      state.result ? humanize(state.result) : null,
      state.role ? humanize(state.role) : null,
      state.search ? `“${state.search}”` : null,
    ].filter(Boolean);
    els.filterSummary.textContent = `${tasks.length} tasks · ${filters.join(" · ")}`;

    els.rows.querySelectorAll("tr[data-task-id]").forEach((row) => {
      row.addEventListener("click", (event) => {
        const taskId = row.dataset.taskId;
        if (event.target instanceof HTMLInputElement) {
          toggleCompare(taskId, event.target.checked);
          return;
        }
        state.selectedTaskId = taskId;
        renderTaskList();
        renderRows();
        renderStage();
        document.querySelector("#trajectories").scrollIntoView({ behavior: "smooth" });
      });
    });
  }

  function renderAll() {
    renderTaskList();
    renderRows();
    renderStage();
  }

  function toggleCompare(taskId, checked) {
    if (checked && state.compareIds.size >= 3) {
      renderRows();
      return;
    }
    if (checked) state.compareIds.add(taskId);
    else state.compareIds.delete(taskId);
    renderCompareBar();
  }

  function renderCompareBar() {
    const count = state.compareIds.size;
    els.compareBar.hidden = count === 0;
    els.compareCount.textContent = String(count);
    els.openCompare.disabled = count < 2;
  }

  function openComparison() {
    const tasks = [...state.compareIds]
      .map((id) => audit.tasks.find((task) => task.task_id === id))
      .filter(Boolean);
    els.compareGrid.innerHTML = tasks
      .map((task) => {
        const media = taskMedia(task.task_id);
        const evidence = evaluationCoverage(task);
        return `
          <section class="compare-item">
            <p class="section-kicker">${escapeHtml(task.domain.toUpperCase())} · ${escapeHtml(humanize(task.difficulty_band))}</p>
            <h3>${escapeHtml(task.task_id)}</h3>
            <div class="tag-row">${scopeBadge(task)} ${resultBadge(task.cua)}</div>
            <dl class="facts">${factRows(task)}</dl>
            <div class="instruction-block">
              <h4>${task.is_game_cua ? "Evaluation coverage" : "Media coverage"}</h4>
              <p>${task.is_game_cua
                ? `${escapeHtml(evidence.label)} protected rows scorable`
                : `Gold: ${escapeHtml(media.gold.status)}<br>Agent: ${escapeHtml(media.agent.status)}`}</p>
            </div>
          </section>`;
      })
      .join("");
    els.compareDialog.showModal();
  }

  document.querySelectorAll("[data-scope]").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-scope]").forEach((item) => {
        item.classList.toggle("is-active", item === button);
      });
      state.scope = button.dataset.scope;
      renderAll();
    });
  });

  els.search.addEventListener("input", () => {
    state.search = els.search.value;
    renderAll();
  });
  els.generation.addEventListener("change", () => {
    state.generation = els.generation.value;
    renderAll();
  });
  els.result.addEventListener("change", () => {
    state.result = els.result.value;
    renderAll();
  });
  els.role.addEventListener("change", () => {
    state.role = els.role.value;
    renderAll();
  });
  document.querySelector("#resetFilters").addEventListener("click", () => {
    state.search = "";
    state.generation = "";
    state.result = "";
    state.role = "";
    els.search.value = "";
    els.generation.value = "";
    els.result.value = "";
    els.role.value = "";
    renderAll();
  });
  document.querySelector("#clearCompare").addEventListener("click", () => {
    state.compareIds.clear();
    renderRows();
    renderCompareBar();
  });
  els.openCompare.addEventListener("click", openComparison);
  document.querySelector("#closeCompare").addEventListener("click", () => els.compareDialog.close());

  const gameTaskCount = Number(gameCollection.summary?.tasks || gameTasks.length);
  const webTasks = audit.tasks.filter((task) => task.domain === "web");
  const mobileTasks = audit.tasks.filter((task) => task.domain === "mobile");
  const webTaskCount = webTasks.length;
  const mobileTaskCount = mobileTasks.length;
  const webEasyCount = webTasks.filter((task) => task.difficulty_band === "easy").length;
  const webFrontierCount = webTaskCount - webEasyCount;
  const gameEasyCount = gameTasks.filter((task) => task.difficulty_band === "easy").length;
  const gameFrontierCount = gameTaskCount - gameEasyCount;
  const mobileEasyCount = mobileTasks.filter((task) => task.difficulty_band === "easy").length;
  const mobileFrontierCount = mobileTaskCount - mobileEasyCount;
  const totalTaskCount = webTaskCount + gameTaskCount + mobileTaskCount;
  document.querySelector("#totalMetric").textContent = totalTaskCount;
  document.querySelector("#webMetric").textContent = webTaskCount;
  document.querySelector("#gameMetric").textContent = gameTaskCount;
  document.querySelector("#mobileMetric").textContent = mobileTaskCount;
  document.querySelector("#webCapabilityMetric").textContent = `${webTaskCount} tasks`;
  document.querySelector("#webEasyMetric").textContent = `${webEasyCount} Easy`;
  document.querySelector("#webFrontierMetric").textContent = `${webFrontierCount} Frontier`;
  document.querySelector("#gameCapabilityMetric").textContent = `${gameTaskCount} tasks`;
  document.querySelector("#gameEasyMetric").textContent = `${gameEasyCount} Easy`;
  document.querySelector("#gameFrontierMetric").textContent = `${gameFrontierCount} Frontier`;
  document.querySelector("#mobileCapabilityMetric").textContent = `${mobileTaskCount} tasks`;
  document.querySelector("#mobileEasyMetric").textContent = `${mobileEasyCount} Lower`;
  document.querySelector("#mobileFrontierMetric").textContent = `${mobileFrontierCount} Upper`;
  document.querySelector("#allScopeTab").textContent = `All ${totalTaskCount}`;
  document.querySelector("#webScopeTab").textContent = `Web ${webTaskCount}`;
  document.querySelector("#gameScopeTab").textContent = `Game ${gameTaskCount}`;
  document.querySelector("#mobileScopeTab").textContent = `Mobile ${mobileTaskCount}`;
  document.querySelector("#auditReportLink").href = publicExport ? "public-docs/web-curation-audit.md" : relativeLink(
    "dataset/reports/WEB_CANONICAL_67_CURATION_REPORT.md",
  );
  document.querySelector("#mobileReportLink").href = publicExport ? "public-docs/mobile-viewer-report.md" : relativeLink(
    "dataset/reports/MOBILE_CUA_20_VIEWER_REPORT.md",
  );

  renderAll();
  renderCompareBar();
})();
