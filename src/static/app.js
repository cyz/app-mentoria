// Dashboard Application for WoMakersCode Mentorship Program
class MentorshipDashboard {
    constructor() {
        this.activities = {};
        this.filteredActivities = {};
        this.currentFilter = 'all';
        this.searchTerm = '';
        this.currentUser = null;
        this.userPermissions = [];
        this.init();
    }

    async init() {
        this.bindEvents();
        await this.loadUserData(); // Aguardar carregamento dos dados do usuário
        await this.loadActivities(); // Só carregar atividades depois dos dados do usuário
    }

    bindEvents() {
        // Search functionality
        document.getElementById('search').addEventListener('input', (e) => {
            this.searchTerm = e.target.value.toLowerCase();
            this.filterAndDisplayActivities();
        });

        // Filter functionality
        document.getElementById('filter').addEventListener('change', (e) => {
            this.currentFilter = e.target.value;
            this.filterAndDisplayActivities();
        });

        // Modal events
        document.getElementById('close-modal').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('activity-modal').addEventListener('click', (e) => {
            if (e.target.id === 'activity-modal') {
                this.closeModal();
            }
        });

        // ESC key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });

        // Profile selector events
        document.getElementById('profile-selector').addEventListener('change', (e) => {
            this.switchProfile(e.target.value);
        });
    }

    async loadActivities() {
        try {
            const response = await fetch('/activities');
            if (!response.ok) {
                throw new Error('Failed to fetch activities');
            }
            
            this.activities = await response.json();
            this.updateStats();
            this.filterAndDisplayActivities();
            
            // Update analytics
            if (window.dashboardAnalytics) {
                dashboardAnalytics.updateMetrics(this.activities);
                this.updateQuickInsights();
            }
        } catch (error) {
            console.error('Error loading activities:', error);
            this.showError('Erro ao carregar mentorias. Tente novamente.');
        }
    }

    updateStats() {
        const activities = Object.values(this.activities);
        
        // Calculate new metrics
        const thisWeekActivities = this.getThisWeekActivities(activities);
        const newSignups = this.getRecentSignups(activities);
        const occupancyRate = this.calculateOccupancyRate(activities);
        const almostFull = this.getAlmostFullActivities(activities);
        
        document.getElementById('this-week-activities').textContent = thisWeekActivities;
        document.getElementById('new-signups').textContent = newSignups;
        document.getElementById('occupancy-rate').textContent = occupancyRate + '%';
        document.getElementById('almost-full').textContent = almostFull;
    }
    
    getThisWeekActivities(activities) {
        // Simplified: count all activities with participants this week
        return activities.filter(activity => activity.participants.length > 0).length;
    }
    
    getRecentSignups(activities) {
        // Simplified: count total new participants (in a real scenario, this would check timestamps)
        return activities.reduce((total, activity) => total + activity.participants.length, 0);
    }
    
    calculateOccupancyRate(activities) {
        if (activities.length === 0) return 0;
        
        const totalCapacity = activities.reduce((sum, activity) => sum + activity.max_participants, 0);
        const totalParticipants = activities.reduce((sum, activity) => sum + activity.participants.length, 0);
        
        return Math.round((totalParticipants / totalCapacity) * 100);
    }
    
    getAlmostFullActivities(activities) {
        return activities.filter(activity => {
            const occupancy = activity.participants.length / activity.max_participants;
            return occupancy >= 0.8 && occupancy < 1.0;
        }).length;
    }

    filterAndDisplayActivities() {
        this.filteredActivities = {};

        Object.entries(this.activities).forEach(([name, activity]) => {
            // Apply search filter
            if (this.searchTerm && !name.toLowerCase().includes(this.searchTerm)) {
                return;
            }

            // Apply availability filter
            const spotsLeft = activity.max_participants - activity.participants.length;
            if (this.currentFilter === 'available' && spotsLeft <= 0) {
                return;
            }
            if (this.currentFilter === 'full' && spotsLeft > 0) {
                return;
            }

            this.filteredActivities[name] = activity;
        });

        this.displayActivities();
    }

    displayActivities() {
        const grid = document.getElementById('activities-grid');
        
        if (Object.keys(this.filteredActivities).length === 0) {
            grid.innerHTML = `
                <div class="col-span-full text-center py-8">
                    <i class="fas fa-search text-4xl text-gray-400 mb-4"></i>
                    <p class="text-gray-600">Nenhuma mentoria encontrada com os filtros aplicados.</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = Object.entries(this.filteredActivities)
            .map(([name, activity]) => this.createActivityCard(name, activity))
            .join('');
    }

    createActivityCard(name, activity) {
        const spotsLeft = activity.max_participants - activity.participants.length;
        const isFull = spotsLeft <= 0;
        const progressPercentage = ((activity.participants.length / activity.max_participants) * 100).toFixed(0);
        
        // Determine card status styling
        const statusClass = isFull ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50';
        const statusIcon = isFull ? 'fas fa-times-circle text-red-500' : 'fas fa-check-circle text-green-500';
        const statusText = isFull ? 'Lotada' : `${spotsLeft} vagas`;
        
        return `
            <div class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
                <div class="p-6">
                    <div class="flex justify-between items-start mb-4">
                        <h3 class="text-xl font-bold text-gray-800 line-clamp-2">${name}</h3>
                        <div class="flex-shrink-0 ml-4">
                            <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusClass}">
                                <i class="${statusIcon} mr-1"></i>
                                ${statusText}
                            </span>
                        </div>
                    </div>
                    
                    <p class="text-gray-600 mb-4 line-clamp-3">${activity.description}</p>
                    
                    <div class="space-y-3 mb-6">
                        <div class="flex items-center text-sm text-gray-700">
                            <i class="fas fa-calendar-alt mr-2 text-primary"></i>
                            <span>${activity.schedule}</span>
                        </div>
                        
                        <div class="flex items-center text-sm text-gray-700">
                            <i class="fas fa-users mr-2 text-secondary"></i>
                            <span>${activity.participants.length}/${activity.max_participants} participantes</span>
                        </div>
                        
                        <!-- Progress Bar -->
                        <div class="w-full bg-gray-200 rounded-full h-2">
                            <div class="h-2 rounded-full ${isFull ? 'bg-red-500' : 'bg-green-500'}" 
                                 style="width: ${progressPercentage}%"></div>
                        </div>
                    </div>
                    
                    <button onclick="dashboard.openActivityModal('${name}')" 
                            class="w-full bg-gradient-to-r from-primary to-secondary text-white py-2 px-4 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300 font-medium">
                        <i class="fas fa-info-circle mr-2"></i>
                        Ver Detalhes
                    </button>
                </div>
            </div>
        `;
    }

    closeModal() {
        document.getElementById('activity-modal').classList.add('hidden');
        document.body.style.overflow = 'auto';
        
        // Clear any form data
        const forms = document.querySelectorAll('#modal-content form');
        forms.forEach(form => form.reset());
    }

    openActivityModal(activityName) {
        const activity = this.activities[activityName];
        if (!activity) return;

        // Verificar se os dados do usuário foram carregados
        if (!this.currentUser || !this.userPermissions) {
            console.warn('User data not loaded yet, reloading...');
            this.loadUserData().then(() => {
                this.openActivityModal(activityName); // Retry after loading
            });
            return;
        }

        const spotsLeft = activity.max_participants - activity.participants.length;
        const isFull = spotsLeft <= 0;

        document.getElementById('modal-title').textContent = activityName;
        document.getElementById('modal-content').innerHTML = `
            <div class="space-y-6">
                <!-- Activity Info -->
                <div class="bg-gray-50 rounded-lg p-4">
                    <h3 class="text-lg font-semibold text-gray-800 mb-3">Informações da Mentoria</h3>
                    <div class="space-y-2">
                        <p><strong>Descrição:</strong> ${activity.description}</p>
                        <p><strong>Horário:</strong> ${activity.schedule}</p>
                        <p><strong>Vagas:</strong> ${activity.participants.length}/${activity.max_participants}</p>
                        <p><strong>Status:</strong> 
                            <span class="inline-flex items-center px-2 py-1 rounded-full text-sm font-medium ${isFull ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}">
                                ${isFull ? 'Lotada' : `${spotsLeft} vagas disponíveis`}
                            </span>
                        </p>
                    </div>
                </div>

                <!-- Participants List -->
                <div>
                    <h3 class="text-lg font-semibold text-gray-800 mb-3">
                        Participantes Inscritas (${activity.participants.length})
                    </h3>
                    ${activity.participants.length > 0 ? `
                        <div class="bg-white border rounded-lg">
                            <div class="max-h-40 overflow-y-auto">
                                ${activity.participants.map((participant, index) => `
                                    <div class="flex items-center justify-between p-3 ${index > 0 ? 'border-t' : ''}">
                                        <div class="flex items-center">
                                            <i class="fas fa-user-circle text-gray-400 mr-3"></i>
                                            <div>
                                                <div class="font-medium text-gray-800">${participant.name}</div>
                                                <div class="text-sm text-gray-600">${participant.email}</div>
                                            </div>
                                        </div>
                                        ${this.userPermissions.includes('manage_participants') || this.userPermissions.includes('delete') || 
                                          (this.userPermissions.includes('self_manage') && participant.email === this.currentUser?.email) ? `
                                            <button onclick="dashboard.cancelParticipant('${activityName}', '${participant.email}')" 
                                                    class="text-red-500 hover:text-red-700 text-sm">
                                                <i class="fas fa-trash-alt mr-1"></i>
                                                ${this.userPermissions.includes('self_manage') ? 'Cancelar Minha Inscrição' : 'Remover'}
                                            </button>
                                        ` : ''}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : `
                        <div class="text-center py-8 text-gray-500">
                            <i class="fas fa-user-plus text-3xl mb-2"></i>
                            <p>Nenhuma participante inscrita ainda</p>
                        </div>
                    `}
                </div>

                <!-- Signup Form -->
                <div class="bg-blue-50 rounded-lg p-4">
                    <h3 class="text-lg font-semibold text-gray-800 mb-3">
                        ${this.userPermissions.includes('self_manage') ? 'Minha Inscrição' : 'Nova Inscrição'}
                    </h3>
                    ${this.userPermissions.includes('manage_participants') || this.userPermissions.includes('create') || this.userPermissions.includes('self_manage') ? `
                        <form onsubmit="dashboard.signupParticipant(event, '${activityName}')" class="space-y-4">
                            ${this.userPermissions.includes('self_manage') ? `
                                <!-- Para participantes, mostrar dados pré-preenchidos -->
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        Seu nome
                                    </label>
                                    <input type="text" value="${this.currentUser?.name || 'Carregando...'}" disabled 
                                           class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        Seu e-mail
                                    </label>
                                    <input type="email" value="${this.currentUser?.email || 'Carregando...'}" disabled 
                                           class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600">
                                </div>
                            ` : `
                                <!-- Para coordenadoras e mentoras, campos editáveis -->
                                <div>
                                    <label for="participant-name" class="block text-sm font-medium text-gray-700 mb-1">
                                        Nome da participante *
                                    </label>
                                    <input type="text" id="participant-name" required 
                                           placeholder="Nome completo"
                                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                           ${isFull ? 'disabled' : ''}>
                                </div>
                                <div>
                                    <label for="participant-email" class="block text-sm font-medium text-gray-700 mb-1">
                                        E-mail da participante *
                                    </label>
                                    <input type="email" id="participant-email" required 
                                           placeholder="participante@womakerscode.org"
                                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                           ${isFull ? 'disabled' : ''}>
                                </div>
                            `}
                            <button type="submit" 
                                    class="w-full py-2 px-4 rounded-lg font-medium transition-colors ${isFull ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-primary text-white hover:bg-purple-700'}"
                                    ${isFull ? 'disabled' : ''}>
                                <i class="fas fa-user-plus mr-2"></i>
                                ${isFull ? 'Mentoria Lotada' : (this.userPermissions.includes('self_manage') ? 'Me Inscrever' : 'Inscrever Participante')}
                            </button>
                        </form>
                    ` : `
                        <div class="text-center py-4 text-gray-600">
                            <i class="fas fa-lock text-2xl mb-2"></i>
                            <p>Você não tem permissão para inscrever participantes</p>
                        </div>
                    `}
                </div>

                <!-- Delete Mentorship Section (for coordinators only) -->
                ${this.userPermissions.includes('delete') ? `
                <div class="bg-red-50 border border-red-200 rounded-lg p-4 mt-6">
                    <h3 class="text-lg font-semibold text-red-800 mb-3">
                        <i class="fas fa-exclamation-triangle mr-2"></i>
                        Área de Administração
                    </h3>
                    <p class="text-sm text-red-700 mb-4">
                        Atenção: A deleção de uma mentoria é uma ação irreversível e removerá todas as inscrições.
                    </p>
                    <button id="delete-mentorship-btn" data-activity-name="${activityName}"
                            class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 text-sm font-medium">
                        <i class="fas fa-trash-alt mr-2"></i>
                        Deletar Mentoria
                    </button>
                </div>
                ` : ''}
            </div>
        `;

        document.getElementById('activity-modal').classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        
        // Add event listener for delete button if it exists
        const deleteBtn = document.getElementById('delete-mentorship-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                const activityName = e.target.closest('button').getAttribute('data-activity-name');
                console.log('Delete button clicked for activity:', activityName);
                this.deleteMentorship(activityName);
            });
        }
    }

    openAddMentorshipModal() {
        document.getElementById('modal-title').textContent = 'Nova Mentoria';
        document.getElementById('modal-content').innerHTML = `
            <form onsubmit="dashboard.createNewMentorship(event)" class="space-y-6">
                <div>
                    <label for="new-mentorship-name" class="block text-sm font-medium text-gray-700 mb-2">
                        Nome da Mentoria *
                    </label>
                    <input type="text" id="new-mentorship-name" required 
                           placeholder="Ex: Gestão de Equipes Remotas"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                </div>
                
                <div>
                    <label for="new-mentorship-description" class="block text-sm font-medium text-gray-700 mb-2">
                        Descrição *
                    </label>
                    <textarea id="new-mentorship-description" required rows="3"
                              placeholder="Descreva o objetivo e conteúdo da mentoria..."
                              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"></textarea>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label for="new-mentorship-day" class="block text-sm font-medium text-gray-700 mb-2">
                            Dia da Semana *
                        </label>
                        <select id="new-mentorship-day" required 
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                            <option value="">Selecione o dia</option>
                            <option value="Segundas-feiras">Segundas-feiras</option>
                            <option value="Terças-feiras">Terças-feiras</option>
                            <option value="Quartas-feiras">Quartas-feiras</option>
                            <option value="Quintas-feiras">Quintas-feiras</option>
                            <option value="Sextas-feiras">Sextas-feiras</option>
                            <option value="Sábados">Sábados</option>
                            <option value="Domingos">Domingos</option>
                        </select>
                    </div>
                    
                    <div>
                        <label for="new-mentorship-start-time" class="block text-sm font-medium text-gray-700 mb-2">
                            Horário de Início *
                        </label>
                        <select id="new-mentorship-start-time" required 
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                            <option value="">Selecione</option>
                            <option value="08:00">08:00</option>
                            <option value="09:00">09:00</option>
                            <option value="10:00">10:00</option>
                            <option value="11:00">11:00</option>
                            <option value="14:00">14:00</option>
                            <option value="15:00">15:00</option>
                            <option value="16:00">16:00</option>
                            <option value="17:00">17:00</option>
                            <option value="18:00">18:00</option>
                            <option value="18:30">18:30</option>
                            <option value="19:00">19:00</option>
                            <option value="19:30">19:30</option>
                            <option value="20:00">20:00</option>
                        </select>
                    </div>
                    
                    <div>
                        <label for="new-mentorship-end-time" class="block text-sm font-medium text-gray-700 mb-2">
                            Horário de Fim *
                        </label>
                        <select id="new-mentorship-end-time" required 
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                            <option value="">Selecione</option>
                            <option value="09:00">09:00</option>
                            <option value="09:30">09:30</option>
                            <option value="10:00">10:00</option>
                            <option value="10:30">10:30</option>
                            <option value="11:00">11:00</option>
                            <option value="11:30">11:30</option>
                            <option value="12:00">12:00</option>
                            <option value="15:00">15:00</option>
                            <option value="15:30">15:30</option>
                            <option value="16:00">16:00</option>
                            <option value="16:30">16:30</option>
                            <option value="17:00">17:00</option>
                            <option value="17:30">17:30</option>
                            <option value="18:00">18:00</option>
                            <option value="18:30">18:30</option>
                            <option value="19:00">19:00</option>
                            <option value="19:30">19:30</option>
                            <option value="20:00">20:00</option>
                            <option value="20:30">20:30</option>
                            <option value="21:00">21:00</option>
                            <option value="21:30">21:30</option>
                            <option value="22:00">22:00</option>
                        </select>
                    </div>
                </div>
                
                <div>
                    <label for="new-mentorship-capacity" class="block text-sm font-medium text-gray-700 mb-2">
                        Capacidade Máxima *
                    </label>
                    <input type="number" id="new-mentorship-capacity" required min="5" max="50" value="20"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                </div>
                
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div class="flex items-start">
                        <i class="fas fa-info-circle text-blue-500 mt-1 mr-2"></i>
                        <div class="text-sm text-blue-800">
                            <p class="font-medium mb-1">Dica:</p>
                            <p>Certifique-se de que o horário não conflite com outras mentorias e que a capacidade seja adequada para o tipo de atividade.</p>
                        </div>
                    </div>
                </div>
                
                <div class="flex justify-end space-x-4 pt-4">
                    <button type="button" onclick="dashboard.closeModal()" 
                            class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                        Cancelar
                    </button>
                    <button type="submit" 
                            class="px-4 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300">
                        <i class="fas fa-plus mr-2"></i>
                        Criar Mentoria
                    </button>
                </div>
            </form>
        `;

        document.getElementById('activity-modal').classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    async createNewMentorship(event) {
        event.preventDefault();
        console.log('createNewMentorship called');
        
        // Capturar os valores dos seletores
        const day = document.getElementById('new-mentorship-day').value;
        const startTime = document.getElementById('new-mentorship-start-time').value;
        const endTime = document.getElementById('new-mentorship-end-time').value;
        
        console.log('Form values:', { day, startTime, endTime });
        
        // Validar se todos os campos estão preenchidos
        if (!day || !startTime || !endTime) {
            console.log('Validation failed: missing time fields');
            this.showError('Por favor, preencha todos os campos de horário');
            return;
        }
        
        // Criar o schedule formatado
        const schedule = `${day} das ${startTime} às ${endTime}`;
        
        const formData = {
            name: document.getElementById('new-mentorship-name').value,
            description: document.getElementById('new-mentorship-description').value,
            schedule: schedule,
            max_participants: parseInt(document.getElementById('new-mentorship-capacity').value)
        };

        console.log('Sending form data:', formData);

        try {
            const response = await fetch('/activities', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            console.log('Response status:', response.status);
            const result = await response.json();
            console.log('Response result:', result);

            if (response.ok) {
                console.log('Creation successful, showing success message');
                this.showSuccess(result.message);
                this.closeModal();
                await this.loadActivities(); // Refresh the activities list
            } else {
                console.log('Creation failed, showing error message');
                this.showError(result.detail || 'Erro ao criar mentoria');
            }
        } catch (error) {
            console.error('Error creating mentorship:', error);
            this.showError('Erro ao criar mentoria. Tente novamente.');
        }
    }

    async deleteMentorship(activityName) {
        console.log('deleteMentorship called with:', activityName);
        
        if (!confirm(`Tem certeza que deseja deletar a mentoria "${activityName}"? Esta ação não pode ser desfeita.`)) {
            console.log('User cancelled deletion');
            return;
        }

        console.log('User confirmed deletion, proceeding...');

        try {
            const encodedActivityName = encodeURIComponent(activityName);
            console.log('Making DELETE request to:', `/activities/${encodedActivityName}`);
            
            const response = await fetch(`/activities/${encodedActivityName}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            console.log('Response status:', response.status);
            const result = await response.json();
            console.log('Response result:', result);

            if (response.ok) {
                console.log('Deletion successful, showing success message');
                this.showSuccess(result.message);
                this.closeModal();
                await this.loadActivities(); // Refresh the activities list
            } else {
                console.log('Deletion failed, showing error message');
                this.showError(result.detail || 'Erro ao deletar mentoria');
            }
        } catch (error) {
            console.error('Error deleting mentorship:', error);
            this.showError('Erro ao deletar mentoria. Tente novamente.');
        }
    }

    async signupParticipant(event, activityName) {
        event.preventDefault();
        console.log('signupParticipant called with activity:', activityName);
        console.log('Current user permissions:', this.userPermissions);
        console.log('Current user:', this.currentUser);
        
        // Verificar se os dados do usuário foram carregados
        if (!this.currentUser) {
            console.error('Current user is null, reloading user data...');
            await this.loadUserData();
            if (!this.currentUser) {
                this.showError('Erro: dados do usuário não carregados. Recarregue a página.');
                return;
            }
        }
        
        let name, email;
        
        if (this.userPermissions.includes('self_manage')) {
            // Para participantes, usar dados do usuário atual
            name = this.currentUser.name;
            email = this.currentUser.email;
            console.log('Using self_manage mode - name:', name, 'email:', email);
            
            // Verificação adicional para garantir que os dados existem
            if (!name || !email) {
                console.error('Current user missing name or email:', this.currentUser);
                this.showError('Erro: dados incompletos do usuário. Tente trocar de perfil e voltar.');
                return;
            }
        } else {
            // Para outros perfis, pegar dos campos do formulário
            const nameField = document.getElementById('participant-name');
            const emailField = document.getElementById('participant-email');
            
            if (!nameField || !emailField) {
                console.error('Form fields not found');
                this.showError('Erro: campos do formulário não encontrados.');
                return;
            }
            
            name = nameField.value;
            email = emailField.value;
            console.log('Using form mode - name:', name, 'email:', email);
        }
        
        if (!name || !email) {
            console.log('Missing name or email');
            this.showError('Nome e email são obrigatórios');
            return;
        }
        
        try {
            const encodedActivityName = encodeURIComponent(activityName);
            
            let url = `/activities/${encodedActivityName}/signup`;
            
            // Se não é auto-gerenciamento, incluir name e email na URL
            if (!this.userPermissions.includes('self_manage')) {
                const encodedName = encodeURIComponent(name);
                const encodedEmail = encodeURIComponent(email);
                url += `?name=${encodedName}&email=${encodedEmail}`;
            }
            
            console.log('Making POST request to:', url);
            
            const response = await fetch(url, { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            console.log('Response status:', response.status);
            const result = await response.json();
            console.log('Response result:', result);

            if (response.ok) {
                console.log('Signup successful');
                this.showSuccess(result.message);
                await this.loadActivities();
                this.openActivityModal(activityName); // Refresh modal
                
                // Clear form apenas se não for auto-gerenciamento
                if (!this.userPermissions.includes('self_manage')) {
                    const nameField = document.getElementById('participant-name');
                    const emailField = document.getElementById('participant-email');
                    if (nameField) nameField.value = '';
                    if (emailField) emailField.value = '';
                }
            } else {
                console.log('Signup failed with error:', result.detail);
                this.showError(result.detail || 'Erro ao realizar inscrição');
            }
        } catch (error) {
            console.error('Error signing up participant:', error);
            this.showError('Erro ao realizar inscrição. Tente novamente.');
        }
    }

    async cancelParticipant(activityName, email) {
        const isOwnCancellation = this.userPermissions.includes('self_manage') && email === this.currentUser.email;
        const confirmMessage = isOwnCancellation 
            ? `Tem certeza que deseja cancelar sua inscrição na mentoria "${activityName}"?`
            : `Tem certeza que deseja remover ${email} da mentoria "${activityName}"?`;
            
        if (!confirm(confirmMessage)) {
            return;
        }

        try {
            const encodedActivityName = encodeURIComponent(activityName);
            
            let url = `/activities/${encodedActivityName}/cancel`;
            
            // Se não é auto-gerenciamento, incluir email na URL
            if (!this.userPermissions.includes('self_manage')) {
                const encodedEmail = encodeURIComponent(email);
                url += `?email=${encodedEmail}`;
            }
            
            console.log('Attempting to cancel participant:', { activityName, email, url });
            
            const response = await fetch(url, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            console.log('Response status:', response.status);
            
            const result = await response.json();
            console.log('Response result:', result);

            if (response.ok) {
                this.showSuccess(result.message);
                await this.loadActivities();
                this.openActivityModal(activityName); // Refresh modal
            } else {
                this.showError(result.detail || 'Erro ao cancelar inscrição');
            }
        } catch (error) {
            console.error('Error canceling participant:', error);
            this.showError('Erro ao cancelar inscrição. Tente novamente.');
        }
    }

    async loadUserData() {
        console.log('Loading user data...');
        try {
            const [userResponse, profilesResponse] = await Promise.all([
                fetch('/users/current'),
                fetch('/users/profiles')
            ]);
            
            console.log('User response status:', userResponse.status);
            console.log('Profiles response status:', profilesResponse.status);
            
            if (userResponse.ok && profilesResponse.ok) {
                const userData = await userResponse.json();
                const profiles = await profilesResponse.json();
                
                console.log('User data loaded:', userData);
                console.log('Profiles loaded:', profiles);
                
                this.currentUser = userData.user;
                this.userPermissions = userData.permissions;
                
                console.log('Current user set to:', this.currentUser);
                console.log('User permissions set to:', this.userPermissions);
                
                this.updateUserInterface(userData, profiles);
            } else {
                console.error('Failed to load user data - user response ok:', userResponse.ok, 'profiles response ok:', profilesResponse.ok);
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }
    
    updateUserInterface(userData, profiles) {
        // Verificar se os elementos existem antes de tentar atualizá-los
        const userNameElement = document.getElementById('current-user-name');
        const profileNameElement = document.getElementById('current-profile-name');
        const iconElement = document.getElementById('current-profile-icon');
        const selector = document.getElementById('profile-selector');
        
        if (userNameElement && userData.user?.name) {
            userNameElement.textContent = userData.user.name;
        }
        
        if (profileNameElement && userData.profile_info?.name) {
            profileNameElement.textContent = userData.profile_info.name;
        }
        
        // Update icon and color
        if (iconElement && userData.profile_info?.icon) {
            iconElement.className = userData.profile_info.icon + ' text-xl';
        }
        
        // Populate profile selector
        if (selector && profiles) {
            selector.innerHTML = '';
            
            Object.entries(profiles).forEach(([key, profile]) => {
                const option = document.createElement('option');
                option.value = key;
                option.textContent = profile.name;
                option.selected = key === userData.user?.profile;
                selector.appendChild(option);
            });
        }
        
        // Update UI based on permissions
        this.updateUIPermissions();
    }
    
    updateUIPermissions() {
        const hasCreatePermission = this.userPermissions.includes('create');
        const newMentorshipButton = document.querySelector('button[onclick*="openAddMentorshipModal"]');
        
        if (newMentorshipButton) {
            if (!hasCreatePermission) {
                newMentorshipButton.style.display = 'none';
            } else {
                newMentorshipButton.style.display = 'block';
            }
        }
    }
    
    async switchProfile(profileName) {
        if (!profileName) return;
        
        try {
            const response = await fetch(`/users/switch-profile?profile_name=${encodeURIComponent(profileName)}`, {
                method: 'POST'
            });
            
            if (response.ok) {
                // Reload user data and refresh interface
                await this.loadUserData();
                this.showSuccess(`Usuário alterado para perfil de ${profileName}!`);
                
                // Reload activities to update permissions
                await this.loadActivities();
            } else {
                const result = await response.json();
                this.showError(result.detail || 'Erro ao alterar perfil');
            }
        } catch (error) {
            console.error('Error switching profile:', error);
            this.showError('Erro ao alterar perfil');
        }
    }

    showSuccess(message) {
        this.showToast(message, 'success');
    }

    showError(message) {
        this.showToast(message, 'error');
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toast-message');
        
        toastMessage.textContent = message;
        
        // Set toast colors based on type
        if (type === 'error') {
            toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
            toast.innerHTML = `
                <div class="flex items-center">
                    <i class="fas fa-exclamation-circle mr-2"></i>
                    <span>${message}</span>
                </div>
            `;
        } else {
            toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
            toast.innerHTML = `
                <div class="flex items-center">
                    <i class="fas fa-check-circle mr-2"></i>
                    <span>${message}</span>
                </div>
            `;
        }
        
        toast.classList.remove('hidden');
        
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 5000);
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new MentorshipDashboard();
});

// Add some utility CSS classes for text truncation
const style = document.createElement('style');
style.textContent = `
    .line-clamp-2 {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }
    .line-clamp-3 {
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }
`;
document.head.appendChild(style);