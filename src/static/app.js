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
        console.log('Dashboard initializing...');
        this.bindEvents();
        console.log('Events bound, loading user data...');
        await this.loadUserData(); // Wait for user data to load
        console.log('User data loaded, loading activities...');
        await this.loadActivities(); // Only load activities after user data
        console.log('Dashboard initialization complete');
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
            const timestamp = new Date().getTime();
            const response = await fetch(`/activities?_t=${timestamp}`);
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
            this.showError('Error loading mentorships. Please try again.');
        }
    }

    async refreshSingleActivity(activityName) {
        console.log('Refreshing single activity:', activityName);
        try {
            const timestamp = new Date().getTime();
            const response = await fetch(`/activities?_t=${timestamp}`);
            if (!response.ok) {
                throw new Error('Failed to fetch activities');
            }
            
            const allActivities = await response.json();
            console.log('Fetched all activities:', allActivities);
            
            if (allActivities[activityName]) {
                console.log('Old activity data:', this.activities[activityName]);
                this.activities[activityName] = allActivities[activityName];
                console.log('New activity data:', this.activities[activityName]);
                
                this.updateStats();
                this.filterAndDisplayActivities();
                
                // Update analytics if available
                if (window.dashboardAnalytics) {
                    dashboardAnalytics.updateMetrics(this.activities);
                    this.updateQuickInsights();
                }
                
                console.log('Single activity refresh completed successfully');
            } else {
                console.error('Activity not found in refreshed data:', activityName);
            }
        } catch (error) {
            console.error('Error refreshing single activity:', error);
            // Fallback to full reload if single activity refresh fails
            await this.loadActivities();
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
                    <p class="text-gray-600">No mentorships found with the applied filters.</p>
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
        const statusText = isFull ? 'Full' : `${spotsLeft} spots`;
        
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
                            <span>${activity.participants.length}/${activity.max_participants} participants</span>
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
                        View Details
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
        console.log('Opening modal for activity:', activityName);
        console.log('Activity data:', activity);
        console.log('Participants count:', activity?.participants?.length || 0);
        
        if (!activity) {
            console.error('Activity not found:', activityName);
            return;
        }

        // Check if user data has been loaded
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
                    <h3 class="text-lg font-semibold text-gray-800 mb-3">Mentorship Information</h3>
                    <div class="space-y-2">
                        <p><strong>Description:</strong> ${activity.description}</p>
                        <p><strong>Schedule:</strong> ${activity.schedule}</p>
                        <p><strong>Spots:</strong> ${activity.participants.length}/${activity.max_participants}</p>
                        <p><strong>Status:</strong> 
                                                        <span class="inline-flex items-center px-2 py-1 rounded-full text-sm font-medium ${isFull ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}">
                                ${isFull ? 'Full' : `${spotsLeft} spots available`}
                            </span>
                        </p>
                    </div>
                </div>

                <!-- Participants List -->
                <div>
                    <h3 class="text-lg font-semibold text-gray-800 mb-3">
                        Enrolled Participants (${activity.participants.length})
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
                                                ${this.userPermissions.includes('self_manage') ? 'Cancel My Enrollment' : 'Remove'}
                                            </button>
                                        ` : ''}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : `
                        <div class="text-center py-8 text-gray-500">
                            <i class="fas fa-user-plus text-3xl mb-2"></i>
                            <p>No participants enrolled yet</p>
                        </div>
                    `}
                </div>

                <!-- Signup Form -->
                <div class="bg-blue-50 rounded-lg p-4">
                    <h3 class="text-lg font-semibold text-gray-800 mb-3">
                        ${this.userPermissions.includes('self_manage') ? 'My Enrollment' : 'New Enrollment'}
                    </h3>
                    ${this.userPermissions.includes('manage_participants') || this.userPermissions.includes('create') || this.userPermissions.includes('self_manage') ? `
                        <form onsubmit="dashboard.signupParticipant(event, '${activityName}')" class="space-y-4">
                            ${this.userPermissions.includes('self_manage') ? `
                                <!-- For participants, show pre-filled data -->
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        Your name
                                    </label>
                                    <input type="text" value="${this.currentUser?.name || 'Loading...'}" disabled 
                                           class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        Your email
                                    </label>
                                    <input type="email" value="${this.currentUser?.email || 'Loading...'}" disabled 
                                           class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600">
                                </div>
                            ` : `
                                <!-- For coordinators and mentors, editable fields -->
                                <div>
                                    <label for="participant-name" class="block text-sm font-medium text-gray-700 mb-1">
                                        Participant name *
                                    </label>
                                    <input type="text" id="participant-name" required 
                                           placeholder="Full name"
                                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                           ${isFull ? 'disabled' : ''}>
                                </div>
                                <div>
                                    <label for="participant-email" class="block text-sm font-medium text-gray-700 mb-1">
                                        Participant email *
                                    </label>
                                    <input type="email" id="participant-email" required 
                                           placeholder="participant@womakerscode.org"
                                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                           ${isFull ? 'disabled' : ''}>
                                </div>
                            `}
                            <button type="submit" 
                                    class="w-full py-2 px-4 rounded-lg font-medium transition-colors ${isFull ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-primary text-white hover:bg-purple-700'}"
                                    ${isFull ? 'disabled' : ''}>
                                <i class="fas fa-user-plus mr-2"></i>
                                ${isFull ? 'Mentorship Full' : (this.userPermissions.includes('self_manage') ? 'Enroll Me' : 'Enroll Participant')}
                            </button>
                        </form>
                    ` : `
                        <div class="text-center py-4 text-gray-600">
                            <i class="fas fa-lock text-2xl mb-2"></i>
                            <p>You don't have permission to enroll participants</p>
                        </div>
                    `}
                </div>

                <!-- Delete Mentorship Section (for coordinators only) -->
                ${this.userPermissions.includes('delete') ? `
                <div class="bg-red-50 border border-red-200 rounded-lg p-4 mt-6">
                    <h3 class="text-lg font-semibold text-red-800 mb-3">
                        <i class="fas fa-exclamation-triangle mr-2"></i>
                        Administration Area
                    </h3>
                    <p class="text-sm text-red-700 mb-4">
                        Warning: Deleting a mentorship is an irreversible action and will remove all enrollments.
                    </p>
                    <button id="delete-mentorship-btn" data-activity-name="${activityName}"
                            class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 text-sm font-medium">
                        <i class="fas fa-trash-alt mr-2"></i>
                        Delete Mentorship
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
        document.getElementById('modal-title').textContent = 'New Mentorship';
        document.getElementById('modal-content').innerHTML = `
            <form onsubmit="dashboard.createNewMentorship(event)" class="space-y-6">
                <div>
                    <label for="new-mentorship-name" class="block text-sm font-medium text-gray-700 mb-2">
                        Mentorship Name *
                    </label>
                    <input type="text" id="new-mentorship-name" required 
                           placeholder="Ex: Remote Team Management"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                </div>
                
                <div>
                    <label for="new-mentorship-description" class="block text-sm font-medium text-gray-700 mb-2">
                        Description *
                    </label>
                    <textarea id="new-mentorship-description" required rows="3"
                              placeholder="Describe the objective and content of the mentorship..."
                              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"></textarea>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label for="new-mentorship-day" class="block text-sm font-medium text-gray-700 mb-2">
                            Day of the Week *
                        </label>
                        <select id="new-mentorship-day" required 
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                            <option value="">Select day</option>
                            <option value="Mondays">Mondays</option>
                            <option value="Tuesdays">Tuesdays</option>
                            <option value="Wednesdays">Wednesdays</option>
                            <option value="Thursdays">Thursdays</option>
                            <option value="Fridays">Fridays</option>
                            <option value="Saturdays">Saturdays</option>
                            <option value="Sundays">Sundays</option>
                        </select>
                    </div>
                    
                    <div>
                        <label for="new-mentorship-start-time" class="block text-sm font-medium text-gray-700 mb-2">
                            Start Time *
                        </label>
                        <select id="new-mentorship-start-time" required 
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                            <option value="">Select</option>
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
                            End Time *
                        </label>
                        <select id="new-mentorship-end-time" required 
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                            <option value="">Select</option>
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
                        Maximum Capacity *
                    </label>
                    <input type="number" id="new-mentorship-capacity" required min="5" max="50" value="20"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                </div>
                
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div class="flex items-start">
                        <i class="fas fa-info-circle text-blue-500 mt-1 mr-2"></i>
                        <div class="text-sm text-blue-800">
                            <p class="font-medium mb-1">Tip:</p>
                            <p>Make sure the schedule doesn't conflict with other mentorships and that the capacity is appropriate for the type of activity.</p>
                        </div>
                    </div>
                </div>
                
                <div class="flex justify-end space-x-4 pt-4">
                    <button type="button" onclick="dashboard.closeModal()" 
                            class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                        Cancel
                    </button>
                    <button type="submit" 
                            class="px-4 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300">
                        <i class="fas fa-plus mr-2"></i>
                        Create Mentorship
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
        
        // Capture selector values
        const day = document.getElementById('new-mentorship-day').value;
        const startTime = document.getElementById('new-mentorship-start-time').value;
        const endTime = document.getElementById('new-mentorship-end-time').value;
        
        console.log('Form values:', { day, startTime, endTime });
        
        // Validate that all fields are filled
        if (!day || !startTime || !endTime) {
            console.log('Validation failed: missing time fields');
            this.showError('Please fill in all schedule fields');
            return;
        }
        
        // Create formatted schedule
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
                this.showError(result.detail || 'Error creating mentorship');
            }
        } catch (error) {
            console.error('Error creating mentorship:', error);
            this.showError('Error creating mentorship. Please try again.');
        }
    }

    async deleteMentorship(activityName) {
        console.log('deleteMentorship called with:', activityName);
        
        if (!confirm(`Are you sure you want to delete the mentorship "${activityName}"? This action cannot be undone.`)) {
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
                this.showError(result.detail || 'Error deleting mentorship');
            }
        } catch (error) {
            console.error('Error deleting mentorship:', error);
            this.showError('Error deleting mentorship. Please try again.');
        }
    }

    async signupParticipant(event, activityName) {
        event.preventDefault();
        console.log('signupParticipant called with activity:', activityName);
        console.log('Current user permissions:', this.userPermissions);
        console.log('Current user:', this.currentUser);
        
        // Check if user data has been loaded
        if (!this.currentUser) {
            console.error('Current user is null, reloading user data...');
            await this.loadUserData();
            if (!this.currentUser) {
                this.showError('Error: user data not loaded. Please reload the page.');
                return;
            }
        }
        
        let name, email;
        
        if (this.userPermissions.includes('self_manage')) {
            // For participants, use current user data
            name = this.currentUser.name;
            email = this.currentUser.email;
            console.log('Using self_manage mode - name:', name, 'email:', email);
            
            // Additional check to ensure data exists
            if (!name || !email) {
                console.error('Current user missing name or email:', this.currentUser);
                this.showError('Error: incomplete user data. Try switching profile and returning.');
                return;
            }
        } else {
            // For other profiles, get from form fields
            const nameField = document.getElementById('participant-name');
            const emailField = document.getElementById('participant-email');
            
            if (!nameField || !emailField) {
                console.error('Form fields not found');
                this.showError('Error: form fields not found.');
                return;
            }
            
            name = nameField.value;
            email = emailField.value;
            console.log('Using form mode - name:', name, 'email:', email);
        }
        
        if (!name || !email) {
            console.log('Missing name or email');
            this.showError('Name and email are required');
            return;
        }
        
        try {
            const encodedActivityName = encodeURIComponent(activityName);
            
            let url = `/activities/${encodedActivityName}/signup`;
            let requestBody = {};
            
            // For self_manage users, send data in request body
            if (this.userPermissions.includes('self_manage')) {
                // No need to add query parameters, backend will use current user data
                requestBody = {};
            } else {
                // For other profiles, include name and email in URL query parameters
                const encodedName = encodeURIComponent(name);
                const encodedEmail = encodeURIComponent(email);
                url += `?name=${encodedName}&email=${encodedEmail}`;
            }
            
            console.log('Making POST request to:', url);
            console.log('Request body:', requestBody);
            
            const response = await fetch(url, { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: Object.keys(requestBody).length > 0 ? JSON.stringify(requestBody) : undefined
            });

            console.log('Response status:', response.status);
            const result = await response.json();
            console.log('Response result:', result);

            if (response.ok) {
                console.log('Signup successful');
                this.showSuccess(result.message);
                
                // Refresh the activity data and then the modal
                await this.refreshSingleActivity(activityName);
                this.openActivityModal(activityName); // Refresh modal with updated data
                
                // Clear form only if not self-management
                if (!this.userPermissions.includes('self_manage')) {
                    const nameField = document.getElementById('participant-name');
                    const emailField = document.getElementById('participant-email');
                    if (nameField) nameField.value = '';
                    if (emailField) emailField.value = '';
                }
            } else {
                console.log('Signup failed with error:', result.detail);
                this.showError(result.detail || 'Error enrolling participant');
            }
        } catch (error) {
            console.error('Error signing up participant:', error);
            this.showError('Error enrolling participant. Please try again.');
        }
    }

    async cancelParticipant(activityName, email) {
        const isOwnCancellation = this.userPermissions.includes('self_manage') && email === this.currentUser.email;
        const confirmMessage = isOwnCancellation 
            ? `Are you sure you want to cancel your enrollment in the mentorship "${activityName}"?`
            : `Are you sure you want to remove ${email} from the mentorship "${activityName}"?`;
            
        if (!confirm(confirmMessage)) {
            return;
        }

        try {
            const encodedActivityName = encodeURIComponent(activityName);
            
            let url = `/activities/${encodedActivityName}/cancel`;
            
            // If not self-management, include email in URL
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
                
                // Refresh the activity data and then the modal
                await this.refreshSingleActivity(activityName);
                this.openActivityModal(activityName); // Refresh modal with updated data
            } else {
                this.showError(result.detail || 'Error canceling enrollment');
            }
        } catch (error) {
            console.error('Error canceling participant:', error);
            this.showError('Error canceling enrollment. Please try again.');
        }
    }

    async loadUserData() {
        console.log('Loading user data...');
        try {
            const timestamp = new Date().getTime();
            const [userResponse, profilesResponse] = await Promise.all([
                fetch(`/users/current?_t=${timestamp}`),
                fetch(`/users/profiles?_t=${timestamp}`)
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
        // Check if elements exist before trying to update them
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
                this.showSuccess(`User switched to ${profileName} profile!`);
                
                // Reload activities to update permissions
                await this.loadActivities();
            } else {
                const result = await response.json();
                this.showError(result.detail || 'Error switching profile');
            }
        } catch (error) {
            console.error('Error switching profile:', error);
            this.showError('Error switching profile');
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