// ===== Task Manager Application =====

class TaskManager {
    constructor() {
        this.tasks = this.loadTasksFromStorage();
        this.currentFilter = 'all';
        this.editingTaskId = null;
        this.sortOrder = localStorage.getItem('taskManagerSort') || 'newest';
        this.theme = localStorage.getItem('taskManagerTheme') || 'light';
        this.focusMode = localStorage.getItem('taskManagerFocus') === 'on';
        
        this.initializeElements();
        this.attachEventListeners();
        this.applyTheme();
        this.applyFocusMode();
        this.updateSortLabel();
        this.renderTasks();
        this.updateStats();
    }

    // Initialize DOM elements
    initializeElements() {
        this.taskForm = document.getElementById('taskForm');
        this.taskInput = document.getElementById('taskInput');
        this.tasksList = document.getElementById('tasksList');
        this.emptyState = document.getElementById('emptyState');
        this.totalTasksEl = document.getElementById('totalTasks');
        this.activeTasksEl = document.getElementById('activeTasks');
        this.completedTasksEl = document.getElementById('completedTasks');
        this.clearCompletedBtn = document.getElementById('clearCompleted');
        this.navButtons = document.querySelectorAll('.nav-btn');
        this.themeToggleBtn = document.getElementById('themeToggle');
        this.sortBtn = document.getElementById('sortTasks');
        this.sampleDataBtn = document.getElementById('sampleDataBtn');
        this.focusModeBtn = document.getElementById('focusModeBtn');
        this.scrollButtons = document.querySelectorAll('[data-scroll-target]');
    }

    // Attach event listeners
    attachEventListeners() {
        // Form submission
        this.taskForm.addEventListener('submit', (e) => this.handleAddTask(e));
        
        // Filter buttons
        this.navButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.target.dataset.filter;
                this.setFilter(filter);
            });
        });
        
        // Clear completed button
        this.clearCompletedBtn.addEventListener('click', () => this.clearCompleted());

        // Theme toggle
        this.themeToggleBtn?.addEventListener('click', () => this.toggleTheme());

        // Sort toggle
        this.sortBtn?.addEventListener('click', () => this.toggleSortOrder());

        // Sample data
        this.sampleDataBtn?.addEventListener('click', () => this.seedSampleTasks());

        // Focus mode
        this.focusModeBtn?.addEventListener('click', () => this.toggleFocusMode());

        // Smooth scroll buttons
        this.scrollButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetSelector = btn.getAttribute('data-scroll-target');
                const target = document.querySelector(targetSelector);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.editingTaskId) {
                this.cancelEdit();
            }
        });
    }

    // Generate unique ID for tasks
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Add new task
    handleAddTask(e) {
        e.preventDefault();
        
        const taskText = this.taskInput.value.trim();
        
        if (!taskText) {
            this.showNotification('Please enter a task!', 'warning');
            return;
        }

        if (this.editingTaskId) {
            // Update existing task
            this.updateTask(this.editingTaskId, taskText);
            this.editingTaskId = null;
            this.taskForm.querySelector('.btn-primary').innerHTML = '<span class="btn-icon">+</span> Add Task';
        } else {
            // Add new task
            const newTask = {
                id: this.generateId(),
                text: taskText,
                completed: false,
                createdAt: new Date().toISOString()
            };
            
            this.tasks.unshift(newTask);
            this.showNotification('Task added successfully!', 'success');
        }
        
        this.taskInput.value = '';
        this.saveTasksToStorage();
        this.renderTasks();
        this.updateStats();
    }

    // Update task text
    updateTask(taskId, newText) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.text = newText;
            this.saveTasksToStorage();
            this.renderTasks();
            this.showNotification('Task updated successfully!', 'success');
        }
    }

    // Toggle task completion
    toggleTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            this.saveTasksToStorage();
            this.renderTasks();
            this.updateStats();
            this.showNotification(
                task.completed ? 'Task marked as completed!' : 'Task marked as active!',
                'success'
            );
        }
    }

    // Delete task
    deleteTask(taskId) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.tasks = this.tasks.filter(t => t.id !== taskId);
            this.saveTasksToStorage();
            this.renderTasks();
            this.updateStats();
            this.showNotification('Task deleted successfully!', 'success');
        }
    }

    // Edit task
    editTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            this.editingTaskId = taskId;
            this.taskInput.value = task.text;
            this.taskInput.focus();
            this.taskForm.querySelector('.btn-primary').innerHTML = '<span class="btn-icon">✓</span> Update Task';
            this.showNotification('Editing task... Press Escape to cancel', 'info');
        }
    }

    // Cancel edit
    cancelEdit() {
        this.editingTaskId = null;
        this.taskInput.value = '';
        this.taskForm.querySelector('.btn-primary').innerHTML = '<span class="btn-icon">+</span> Add Task';
    }

    // Set filter
    setFilter(filter) {
        this.currentFilter = filter;
        
        // Update active button
        this.navButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        
        this.renderTasks();
    }

    // Get filtered tasks
    getFilteredTasks() {
        let filtered;
        switch (this.currentFilter) {
            case 'active':
                filtered = this.tasks.filter(t => !t.completed);
                break;
            case 'completed':
                filtered = this.tasks.filter(t => t.completed);
                break;
            default:
                filtered = [...this.tasks];
        }

        return filtered.sort((a, b) => {
            const first = new Date(a.createdAt).getTime();
            const second = new Date(b.createdAt).getTime();
            return this.sortOrder === 'newest' ? second - first : first - second;
        });
    }

    // Clear completed tasks
    clearCompleted() {
        const completedCount = this.tasks.filter(t => t.completed).length;
        
        if (completedCount === 0) {
            this.showNotification('No completed tasks to clear!', 'info');
            return;
        }
        
        if (confirm(`Are you sure you want to delete ${completedCount} completed task(s)?`)) {
            this.tasks = this.tasks.filter(t => !t.completed);
            this.saveTasksToStorage();
            this.renderTasks();
            this.updateStats();
            this.showNotification('Completed tasks cleared!', 'success');
        }
    }

    // Render tasks
    renderTasks() {
        const filteredTasks = this.getFilteredTasks();
        
        this.tasksList.innerHTML = '';
        
        if (filteredTasks.length === 0) {
            this.emptyState.classList.add('show');
            return;
        }
        
        this.emptyState.classList.remove('show');
        
        filteredTasks.forEach(task => {
            const taskItem = this.createTaskElement(task);
            this.tasksList.appendChild(taskItem);
        });
    }

    // Create task element
    createTaskElement(task) {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;
        li.setAttribute('data-task-id', task.id);
        
        li.innerHTML = `
            <input 
                type="checkbox" 
                class="task-checkbox" 
                ${task.completed ? 'checked' : ''}
                aria-label="Toggle task completion"
            >
            <span class="task-text">${this.escapeHtml(task.text)}</span>
            <div class="task-actions">
                <button class="task-btn task-btn-edit" aria-label="Edit task" title="Edit task">
                    ✏️
                </button>
                <button class="task-btn task-btn-delete" aria-label="Delete task" title="Delete task">
                    🗑️
                </button>
            </div>
        `;
        
        // Attach event listeners
        const checkbox = li.querySelector('.task-checkbox');
        const editBtn = li.querySelector('.task-btn-edit');
        const deleteBtn = li.querySelector('.task-btn-delete');
        
        checkbox.addEventListener('change', () => this.toggleTask(task.id));
        editBtn.addEventListener('click', () => this.editTask(task.id));
        deleteBtn.addEventListener('click', () => this.deleteTask(task.id));
        
        return li;
    }

    // Update statistics
    updateStats() {
        const total = this.tasks.length;
        const active = this.tasks.filter(t => !t.completed).length;
        const completed = this.tasks.filter(t => t.completed).length;
        
        this.totalTasksEl.textContent = total;
        this.activeTasksEl.textContent = active;
        this.completedTasksEl.textContent = completed;
        
        // Animate number changes
        this.animateNumber(this.totalTasksEl);
        this.animateNumber(this.activeTasksEl);
        this.animateNumber(this.completedTasksEl);
    }

    // Animate number change
    animateNumber(element) {
        element.style.transform = 'scale(1.2)';
        setTimeout(() => {
            element.style.transform = 'scale(1)';
        }, 200);
    }

    // Escape HTML to prevent XSS
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Show notification
    showNotification(message, type = 'info') {
        // Remove existing notification
        const existing = document.querySelector('.notification');
        if (existing) {
            existing.remove();
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Add styles
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '1rem 1.5rem',
            background: type === 'success' ? '#10b981' : type === 'warning' ? '#f59e0b' : '#6366f1',
            color: 'white',
            borderRadius: '12px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            zIndex: '1000',
            animation: 'slideInRight 0.3s ease-out',
            maxWidth: '300px',
            fontSize: '0.875rem',
            fontWeight: '500'
        });
        
        document.body.appendChild(notification);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Save tasks to localStorage
    saveTasksToStorage() {
        try {
            localStorage.setItem('tasks', JSON.stringify(this.tasks));
        } catch (error) {
            console.error('Error saving tasks:', error);
            this.showNotification('Error saving tasks to storage', 'warning');
        }
    }

    // Load tasks from localStorage
    loadTasksFromStorage() {
        try {
            const stored = localStorage.getItem('tasks');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading tasks:', error);
            return [];
        }
    }

    // Theme handlers
    applyTheme() {
        const isDark = this.theme === 'dark';
        document.body.classList.toggle('theme-dark', isDark);
        document.body.classList.toggle('theme-light', !isDark);
        if (this.themeToggleBtn) {
            this.themeToggleBtn.textContent = isDark ? 'Dark' : 'Light';
        }
        localStorage.setItem('taskManagerTheme', this.theme);
    }

    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        this.applyTheme();
        this.showNotification(`Switched to ${this.theme} theme`, 'info');
    }

    // Sort handlers
    toggleSortOrder() {
        this.sortOrder = this.sortOrder === 'newest' ? 'oldest' : 'newest';
        this.updateSortLabel();
        localStorage.setItem('taskManagerSort', this.sortOrder);
        this.renderTasks();
    }

    updateSortLabel() {
        if (this.sortBtn) {
            this.sortBtn.textContent = this.sortOrder === 'newest' ? 'Newest' : 'Oldest';
        }
    }

    // Focus mode
    applyFocusMode() {
        document.body.classList.toggle('focus-mode', this.focusMode);
        if (this.focusModeBtn) {
            this.focusModeBtn.textContent = this.focusMode ? 'On' : 'Off';
            this.focusModeBtn.classList.toggle('chip-success', this.focusMode);
            this.focusModeBtn.classList.toggle('chip-outline', !this.focusMode);
        }
        localStorage.setItem('taskManagerFocus', this.focusMode ? 'on' : 'off');
    }

    toggleFocusMode() {
        this.focusMode = !this.focusMode;
        this.applyFocusMode();
        this.showNotification(
            `Focus mode ${this.focusMode ? 'enabled' : 'disabled'}`,
            'info'
        );
    }

    // Demo data
    seedSampleTasks() {
        const sampleTasks = [
            'Review sprint goals',
            'Design landing section',
            'Reply to priority emails',
            'Share product update',
            'Plan tomorrow\'s agenda'
        ];

        if (this.tasks.length && !confirm('Add demo tasks to your current list?')) {
            return;
        }

        const now = Date.now();
        const seeded = sampleTasks.map((text, index) => ({
            id: this.generateId(),
            text,
            completed: index % 2 === 0,
            createdAt: new Date(now - index * 60000).toISOString()
        }));

        this.tasks = [...seeded, ...this.tasks];
        this.saveTasksToStorage();
        this.renderTasks();
        this.updateStats();
        this.showNotification('Demo tasks added!', 'success');
    }
}

// Add notification animations to CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.taskManager = new TaskManager();
    console.log('Task Manager initialized. Ready to manage your tasks!');
});

