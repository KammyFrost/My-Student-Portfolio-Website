function getGreeting(hour) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}
function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
function initDynamicContent() {
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  const greeting = document.getElementById("greeting");
  if (greeting) {
    greeting.textContent = getGreeting(new Date().getHours()) + ", welcome to my portfolio!";
  }
}
function initProjectFilter() {
  const buttons = document.querySelectorAll(".filter-btn");
  const cards = document.querySelectorAll(".project-card");
  if (buttons.length === 0) return;

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.dataset.filter;

      buttons.forEach((b) => b.setAttribute("aria-pressed", String(b === button)));

      cards.forEach((card) => {
        const techs = (card.dataset.tech || "").split(" ");
        card.hidden = !(filter === "all" || techs.includes(filter));
      });
    });
  });
}
function initContactForm() {
  const form = document.getElementById("contact-form");
  if (!form) return;

  const status = document.getElementById("form-status");
  const counter = document.getElementById("message-count");
  const MAX_MESSAGE = 500;

  const rules = {
    name: (v) => {
      if (v.trim() === "") return "Name cannot be empty.";
      return v.trim().length < 2 ? "Please enter your name (at least 2 characters)." : "";
    },
    email: (v) => {
      if (v.trim() === "") return "Email address cannot be empty.";
      return isValidEmail(v) ? "" : "Please enter a valid email address, like name@example.com.";
    },
    phone: (v) => {
      if (v.trim() === "") return "Phone number cannot be empty.";
      return /^\d+$/.test(v.trim()) ? "" : "Phone number must contain digits only (no spaces, + or dashes).";
    },
    message: (v) => {
      if (v.trim() === "") return "Message cannot be empty.";
      if (v.trim().length < 10) return "Your message should be at least 10 characters.";
      if (v.length > MAX_MESSAGE) return "Your message is too long (max " + MAX_MESSAGE + ").";
      return "";
    },
  };


  function showError(field, message) {
    document.getElementById(field.id + "-error").textContent = message;
    field.setAttribute("aria-invalid", message ? "true" : "false");
    field.classList.toggle("invalid", Boolean(message));
  }

  function validateField(field) {
    const message = rules[field.id](field.value);
    showError(field, message);
    return message === "";
  }

  const fields = Object.keys(rules).map((id) => document.getElementById(id));
  fields.forEach((field) => {
    field.addEventListener("blur", () => validateField(field));
    field.addEventListener("input", () => {
      if (field.classList.contains("invalid")) validateField(field);
    });
  });
  document.getElementById("message").addEventListener("input", (event) => {
    counter.textContent = event.target.value.length + " / " + MAX_MESSAGE;
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const results = fields.map(validateField);
    if (results.includes(false)) {
      status.textContent = "Please fix the highlighted fields.";
      fields.find((f) => f.classList.contains("invalid")).focus();
      return;
    }
    status.textContent = "Thanks, " + fields[0].value.trim() + "! Your message is ready to send.";
    form.reset();
    counter.textContent = "0 / " + MAX_MESSAGE;
  });
}
function initTaskManager() {
  const form = document.getElementById("task-form");
  if (!form) return;

  const input = document.getElementById("task-input");
  const priority = document.getElementById("task-priority");
  const error = document.getElementById("task-error");
  const list = document.getElementById("task-list");
  const count = document.getElementById("task-count");
  const filterButtons = document.querySelectorAll(".task-filter");
  const clearButton = document.getElementById("clear-done");

  let tasks = loadTasks();
  let currentFilter = "all";

  function loadTasks() {
    try {
      return JSON.parse(localStorage.getItem("tasks")) || [];
    } catch (e) {
      return [];
    }
  }

  function saveTasks() {
    try {
      localStorage.setItem("tasks", JSON.stringify(tasks));
    } catch (e) {
    }
  }

  function addTask(text, level) {
    tasks.push({ id: Date.now(), text: text, priority: level, done: false });
    saveTasks();
    render();
  }

  function toggleTask(id) {
    tasks = tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
    saveTasks();
    render();
  }

  function deleteTask(id) {
    tasks = tasks.filter((t) => t.id !== id);
    saveTasks();
    render();
  }

  function render() {
    const visible = tasks.filter((t) => {
      if (currentFilter === "active") return !t.done;
      if (currentFilter === "done") return t.done;
      return true;
    });

    list.innerHTML = "";

    visible.forEach((task) => {
      const item = document.createElement("li");
      item.className = "task priority-" + task.priority + (task.done ? " done" : "");
      item.dataset.id = task.id;

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = task.done;
      checkbox.id = "task-" + task.id;
      checkbox.dataset.action = "toggle";

      const label = document.createElement("label");
      label.htmlFor = checkbox.id;
      label.textContent = task.text;

      const badge = document.createElement("span");
      badge.className = "badge";
      badge.textContent = task.priority;

      const remove = document.createElement("button");
      remove.type = "button";
      remove.dataset.action = "delete";
      remove.textContent = "Delete";
      remove.setAttribute("aria-label", "Delete task: " + task.text);

      item.append(checkbox, label, badge, remove);
      list.appendChild(item);
    });

    const remaining = tasks.filter((t) => !t.done).length;
    count.textContent =
      tasks.length === 0
        ? "No tasks yet. Add your first one above."
        : remaining + " of " + tasks.length + " tasks remaining";
  }
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const text = input.value.trim();

    if (text === "") {
      error.textContent = "Please type a task first.";
      input.setAttribute("aria-invalid", "true");
      input.focus();
      return;
    }
    error.textContent = "";
    input.setAttribute("aria-invalid", "false");
    addTask(text, priority.value);
    form.reset();
    priority.value = "medium";
    input.focus();
  });
  list.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action='delete']");
    if (button) deleteTask(Number(button.closest("li").dataset.id));
  });

  list.addEventListener("change", (event) => {
    if (event.target.dataset.action === "toggle") {
      toggleTask(Number(event.target.closest("li").dataset.id));
    }
  });
  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      currentFilter = button.dataset.filter;
      filterButtons.forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
      render();
    });
  });
  clearButton.addEventListener("click", () => {
    tasks = tasks.filter((t) => !t.done);
    saveTasks();
    render();
  });

  render();
}
initDynamicContent();
initProjectFilter();
initContactForm();
initTaskManager();