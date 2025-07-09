class TodoApp {
    constructor() {
        this.todos = JSON.parse(localStorage.getItem('todos')) || [];
        this.currentFilter = 'all';
        this.currentColors = JSON.parse(localStorage.getItem('todoColors')) || ['purple-400', 'pink-500', 'red-500'];
        this.init();
    }

    init() {
        this.bindEvents();
        this.bindColorEvents();
        this.applyColors();
        this.render();
    }

    bindEvents() {
        const todoInput = document.getElementById('todoInput');
        const addBtn = document.getElementById('addBtn');
        const filterBtns = document.querySelectorAll('.filter-btn');

        // Add todo on button click or Enter key
        addBtn.addEventListener('click', () => this.addTodo());
        todoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTodo();
        });

        // Filter buttons
        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });
    }

    addTodo() {
        const input = document.getElementById('todoInput');
        const text = input.value.trim();

        if (text === '') return;

        const todo = {
            id: Date.now(),
            text: text,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.todos.unshift(todo);
        this.saveTodos();
        this.render();
        input.value = '';
        input.focus();
    }

    toggleTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            this.saveTodos();
            this.render();
        }
    }

    deleteTodo(id) {
        this.todos = this.todos.filter(t => t.id !== id);
        this.saveTodos();
        this.render();
    }

    editTodo(id, newText) {
        const todo = this.todos.find(t => t.id === id);
        if (todo && newText.trim() !== '') {
            todo.text = newText.trim();
            this.saveTodos();
            this.render();
        }
    }

    setFilter(filter) {
        this.currentFilter = filter;
        
        // Update active filter button
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active', 'bg-white/40');
            btn.classList.add('bg-white/20');
        });
        
        const activeBtn = document.querySelector(`[data-filter="${filter}"]`);
        activeBtn.classList.add('active', 'bg-white/40');
        activeBtn.classList.remove('bg-white/20');

        this.render();
    }

    getFilteredTodos() {
        switch (this.currentFilter) {
            case 'active':
                return this.todos.filter(todo => !todo.completed);
            case 'completed':
                return this.todos.filter(todo => todo.completed);
            default:
                return this.todos;
        }
    }

    render() {
        const todoList = document.getElementById('todoList');
        const emptyState = document.getElementById('emptyState');
        const stats = document.getElementById('stats');
        
        const filteredTodos = this.getFilteredTodos();
        const activeTodos = this.todos.filter(todo => !todo.completed);

        // Update stats
        const activeCount = activeTodos.length;
        stats.textContent = `${activeCount} ${activeCount === 1 ? 'item' : 'items'} left`;

        // Show/hide empty state
        if (filteredTodos.length === 0) {
            emptyState.style.display = 'block';
            todoList.innerHTML = '';
            return;
        }

        emptyState.style.display = 'none';

        // Render todos
        todoList.innerHTML = filteredTodos.map(todo => this.createTodoHTML(todo)).join('');

        // Bind events for todo items
        this.bindTodoEvents();
    }

    createTodoHTML(todo) {
        const completedClass = todo.completed ? 'opacity-60' : '';
        const checkedClass = todo.completed ? 'text-green-400' : 'text-white/40';
        const textClass = todo.completed ? 'line-through text-white/60' : 'text-white';

        return `
            <div class="todo-item p-4 hover:bg-white/5 transition-all duration-300 ${completedClass} animate-bounce-in" data-id="${todo.id}">
                <div class="flex items-center gap-3">
                    <button class="toggle-btn text-xl ${checkedClass} hover:text-green-400 transition-colors duration-300">
                        <i class="fas ${todo.completed ? 'fa-check-circle' : 'fa-circle'}"></i>
                    </button>
                    <span class="todo-text flex-1 ${textClass} cursor-pointer select-none">${this.escapeHtml(todo.text)}</span>
                    <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button class="edit-btn text-blue-400 hover:text-blue-300 transition-colors duration-300">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="delete-btn text-red-400 hover:text-red-300 transition-colors duration-300">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    bindTodoEvents() {
        document.querySelectorAll('.todo-item').forEach(item => {
            const id = parseInt(item.dataset.id);
            
            // Add hover effect
            item.classList.add('group');

            // Toggle completion
            item.querySelector('.toggle-btn').addEventListener('click', () => {
                this.toggleTodo(id);
            });

            // Delete todo
            item.querySelector('.delete-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteTodo(id);
            });

            // Edit todo
            item.querySelector('.edit-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this.startEdit(id, item);
            });

            // Toggle on text click
            item.querySelector('.todo-text').addEventListener('click', () => {
                this.toggleTodo(id);
            });
        });
    }

    startEdit(id, item) {
        const todo = this.todos.find(t => t.id === id);
        const textElement = item.querySelector('.todo-text');
        
        const input = document.createElement('input');
        input.type = 'text';
        input.value = todo.text;
        input.className = 'flex-1 bg-white/20 border border-white/30 rounded px-2 py-1 text-white focus:outline-none focus:ring-2 focus:ring-white/50';
        
        textElement.replaceWith(input);
        input.focus();
        input.select();

        const finishEdit = () => {
            const newText = input.value.trim();
            if (newText !== '') {
                this.editTodo(id, newText);
            } else {
                this.render();
            }
        };

        input.addEventListener('blur', finishEdit);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') finishEdit();
            if (e.key === 'Escape') this.render();
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    bindColorEvents() {
        const colorToggle = document.getElementById('colorToggle');
        const colorPanel = document.getElementById('colorPanel');
        const closeColorPanel = document.getElementById('closeColorPanel');
        const colorPresets = document.querySelectorAll('.color-preset');
        const applyCustom = document.getElementById('applyCustom');
        const customColors = [
            document.getElementById('color1'),
            document.getElementById('color2'),
            document.getElementById('color3')
        ];

        // Toggle color panel
        colorToggle.addEventListener('click', () => {
            colorPanel.classList.toggle('translate-y-full');
        });

        closeColorPanel.addEventListener('click', () => {
            colorPanel.classList.add('translate-y-full');
        });

        // Preset color themes
        colorPresets.forEach(preset => {
            preset.addEventListener('click', () => {
                const colors = preset.dataset.colors.split(',');
                this.changeColors(colors);
                colorPanel.classList.add('translate-y-full');
            });
        });

        // Custom color application
        applyCustom.addEventListener('click', () => {
            const colors = customColors.map(input => this.hexToTailwind(input.value));
            this.changeColors(colors);
            colorPanel.classList.add('translate-y-full');
        });

        // Update custom color inputs when colors change
        this.updateCustomColorInputs();
    }

    changeColors(colors) {
        this.currentColors = colors;
        this.applyColors();
        this.saveColors();
        this.updateCustomColorInputs();
    }

    applyColors() {
        const [color1, color2, color3] = this.currentColors;
        const body = document.body;

        // Create gradient classes mapping
        const gradientMap = {
            'purple-400': '#a855f7',
            'pink-500': '#ec4899',
            'red-500': '#ef4444',
            'blue-400': '#60a5fa',
            'cyan-500': '#06b6d4',
            'teal-500': '#14b8a6',
            'green-400': '#4ade80',
            'emerald-500': '#10b981',
            'lime-500': '#84cc16',
            'orange-400': '#fb923c',
            'indigo-400': '#818cf8',
            'gray-600': '#4b5563',
            'gray-700': '#374151',
            'gray-800': '#1f2937'
        };

        const hex1 = gradientMap[color1] || color1;
        const hex2 = gradientMap[color2] || color2;
        const hex3 = gradientMap[color3] || color3;

        body.style.background = `linear-gradient(135deg, ${hex1}, ${hex2}, ${hex3})`;
    }

    hexToTailwind(hex) {
        // Simple mapping for common colors - in a real app you'd want a more comprehensive mapping
        const colorMap = {
            '#a855f7': 'purple-400',
            '#ec4899': 'pink-500',
            '#ef4444': 'red-500',
            '#60a5fa': 'blue-400',
            '#06b6d4': 'cyan-500',
            '#14b8a6': 'teal-500',
            '#4ade80': 'green-400',
            '#10b981': 'emerald-500',
            '#84cc16': 'lime-500',
            '#fb923c': 'orange-400',
            '#818cf8': 'indigo-400',
            '#4b5563': 'gray-600',
            '#374151': 'gray-700',
            '#1f2937': 'gray-800'
        };

        return colorMap[hex] || hex;
    }

    updateCustomColorInputs() {
        const customColors = [
            document.getElementById('color1'),
            document.getElementById('color2'),
            document.getElementById('color3')
        ];

        const colorMap = {
            'purple-400': '#a855f7',
            'pink-500': '#ec4899',
            'red-500': '#ef4444',
            'blue-400': '#60a5fa',
            'cyan-500': '#06b6d4',
            'teal-500': '#14b8a6',
            'green-400': '#4ade80',
            'emerald-500': '#10b981',
            'lime-500': '#84cc16',
            'orange-400': '#fb923c',
            'indigo-400': '#818cf8',
            'gray-600': '#4b5563',
            'gray-700': '#374151',
            'gray-800': '#1f2937'
        };

        this.currentColors.forEach((color, index) => {
            if (customColors[index]) {
                customColors[index].value = colorMap[color] || color;
            }
        });
    }

    saveColors() {
        localStorage.setItem('todoColors', JSON.stringify(this.currentColors));
    }

    saveTodos() {
        localStorage.setItem('todos', JSON.stringify(this.todos));
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TodoApp();
});
