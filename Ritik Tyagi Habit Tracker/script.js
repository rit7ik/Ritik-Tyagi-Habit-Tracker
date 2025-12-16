document.addEventListener('DOMContentLoaded', () => {

    let habits = JSON.parse(localStorage.getItem('habits')) || [];
    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();
    let reminderTimeout = null; 

    const USERNAME_KEY = 'currentUsername';
    const THEME_KEY = 'theme';
    const INTRO_SEEN_KEY = 'introSeen';
    const REMINDER_TIME_KEY = 'elevateDaily_reminder_time';
    const REMINDER_PURPOSE_KEY = 'elevateDaily_reminder_purpose';
    
    const saveHabits = () => {
        localStorage.setItem('habits', JSON.stringify(habits));
    };

    const getTodayDateString = () => {
        
        return new Date().toISOString().slice(0, 10); 
    };

    const parseAMPMTime = (timeString) => {
        const match = timeString.match(/^(\d{1,2}):(\d{2}):(\d{2})\s*(AM|PM)$/i);
        if (!match) return null;

        let hour = parseInt(match[1]);
        const minute = parseInt(match[2]);
        const second = parseInt(match[3]);
        const period = match[4].toUpperCase();

        if (period === 'AM' && hour === 12) {
            hour = 0;
        } else if (period === 'PM' && hour < 12) {
            hour += 12;
        }
        
        if (hour > 23 || minute > 59 || second > 59) return null;

        return { hour, minute, second };
    };

    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const loginContainer = document.getElementById('login-container');
    const introScreen = document.getElementById('intro-screen');
    const mainContainer = document.querySelector('.container');
    const loginButton = document.getElementById('login-button');
    const startButton = document.getElementById('start-button');
    const loginMessage = document.getElementById('login-message');
    const habitInput = document.getElementById('habit-input');
    const addHabitButton = document.getElementById('add-habit-button');
    const habitList = document.getElementById('habit-list');
    const emptyMessage = document.getElementById('empty-message');
    const themeButton = document.getElementById('theam');
    const usernameDisplay = document.getElementById('username-display');
    const body = document.body;
    const calendarView = document.getElementById('calendar-view');
    const currentMonthYearSpan = document.getElementById('current-month-year');
    const prevMonthButton = document.getElementById('prev-month');
    const nextMonthButton = document.getElementById('next-month');
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    const logoutButton = document.getElementById('logout-button'); 
    
    const reminderTimeInput = document.getElementById('reminder-time-input');
    const reminderPurposeInput = document.getElementById('reminder-purpose-input');
    const setReminderButton = document.getElementById('set-reminder-button');
    const disableReminderButton = document.getElementById('disable-reminder-button');
    const reminderMessage = document.getElementById('reminder-message');
    const reminderNextRun = document.getElementById('reminder-next-run');

    const perfectDaysSpan = document.getElementById('perfect-days-count');
    const longestStreakSpan = document.getElementById('longest-streak');
    
    const modal = document.getElementById('calendar-detail-modal');
    const closeModal = document.querySelector('.close-button');
    const modalDateHeader = document.getElementById('modal-date-header');
    const modalHabitDetails = document.getElementById('modal-habit-details');

    const motivationalQuotes = [
        { quote: "The journey of a thousand miles begins with a single step.", author: "Lao Tzu" },
        { quote: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle" },
        { quote: "Discipline is the bridge between goals and accomplishment.", author: "Jim Rohn" },
        { quote: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
        { quote: "Motivation is what gets you started. Habit is what keeps you going.", author: "Jim Ryun" },
        { quote: "You will never change your life until you change something you do daily.", author: "John C. Maxwell" },
        { quote: "Small daily improvements are the key to staggering long-term results.", author: "Robin Sharma" },
        { quote: "The habit of persistence is the habit of victory.", author: "Herbert Kaufman" }
    ];
    
    const requestNotificationPermission = async () => {
        if (!("Notification" in window)) {
            reminderMessage.textContent = "Notifications are not supported by your browser.";
            return false;
        }
        
        if (Notification.permission !== 'granted') {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                reminderMessage.textContent = "Permission denied. Enable notifications in browser settings.";
                return false;
            }
        }
        return true;
    };

    const disableReminder = () => {
        if (reminderTimeout) {
            clearTimeout(reminderTimeout);
        }
        localStorage.removeItem(REMINDER_TIME_KEY);
        localStorage.removeItem(REMINDER_PURPOSE_KEY); 
        
        reminderTimeInput.value = '09:00:00 AM'; 
        reminderPurposeInput.value = 'Time to check off my habits!'; 
        reminderNextRun.textContent = ''; 
        
        reminderMessage.textContent = "Reminder disabled. Set a new time when you're ready!";
        reminderMessage.style.color = '#dc3545';
    };

    const scheduleDailyReminder = (timeString, purposeString) => {
        if (reminderTimeout) {
            clearTimeout(reminderTimeout);
        }
        
        const timeComponents = parseAMPMTime(timeString);
        if (!timeComponents) return; 

        localStorage.setItem(REMINDER_TIME_KEY, timeString);
        localStorage.setItem(REMINDER_PURPOSE_KEY, purposeString);
        
        const { hour: targetHour, minute: targetMinute, second: targetSecond } = timeComponents;
        
        const now = new Date();
        const target = new Date();
        
        target.setHours(targetHour, targetMinute, targetSecond, 0);

        let delay = target.getTime() - now.getTime();

        if (delay < 0) {
            target.setDate(target.getDate() + 1); 
            delay = target.getTime() - now.getTime();
        }
        
        const fireNotification = () => {
            const currentPurpose = localStorage.getItem(REMINDER_PURPOSE_KEY) || "It's reminder time!";
            
            new Notification("🔥 Daily Reminder: Action Time!", {
                body: currentPurpose,
                icon: "https://img.icons8.com/material-rounded/24/lightning-bolt--v1.png",
                requireInteraction: true 
            });
            
           
            scheduleDailyReminder(timeString, purposeString);
        };

        reminderTimeout = setTimeout(fireNotification, delay);
        
        const options = { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
        };
        const nextFireDetails = target.toLocaleTimeString('en-US', options);

        reminderNextRun.textContent = `Next Run: ${nextFireDetails}`;
        reminderMessage.textContent = `Reminder set for ${timeString} with purpose: "${purposeString}".`;
        reminderMessage.style.color = 'green';
    };

    const startReminderCheck = () => {
        const savedTime = localStorage.getItem(REMINDER_TIME_KEY);
        const savedPurpose = localStorage.getItem(REMINDER_PURPOSE_KEY); 

        if (savedTime) { 
            reminderTimeInput.value = savedTime; 
            reminderPurposeInput.value = savedPurpose || 'Time to check off my habits!'; 
            scheduleDailyReminder(savedTime, reminderPurposeInput.value);
        } else {
            reminderTimeInput.value = '09:00:00 AM'; 
            reminderPurposeInput.value = 'Time to check off my habits!'; 
            reminderNextRun.textContent = '';
            reminderMessage.textContent = "Set a time to get a daily reminder.";
            reminderMessage.style.color = '#333';
        }
    };

    const displayRandomQuote = () => {
        const randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
        const randomQuote = motivationalQuotes[randomIndex];
        
        document.getElementById('quote-text').textContent = `"${randomQuote.quote}"`;
        document.getElementById('quote-author').textContent = `- ${randomQuote.author}`;
    };

    const displayUsername = () => {
        const storedUsername = localStorage.getItem(USERNAME_KEY);
        if (storedUsername && usernameDisplay) {
            const formattedName = storedUsername.charAt(0).toUpperCase() + storedUsername.slice(1);
            usernameDisplay.textContent = formattedName;
        }
    };

    const handleHabitDeletion = (e) => {
        const button = e.target.closest('.delete-btn');
        if (!button) return;

        const habitId = parseInt(button.dataset.id);
        
        habits = habits.filter(h => h.id !== habitId);

        saveHabits();
        renderHabits();
        updateProgressStats(); 
        renderCalendar(); 
    };

    const renderHabits = () => {
        habitList.innerHTML = ''; 
        
        if (habits.length === 0) {
            emptyMessage.classList.remove('hidden');
            return;
        }
        emptyMessage.classList.add('hidden');

        const todayDate = getTodayDateString();

        habits.forEach(habit => {
            const isCompletedToday = habit.completionDates.some(
                completion => completion.date === todayDate
            );

            const habitItem = document.createElement('div');
            habitItem.className = `habit-item ${isCompletedToday ? 'completed' : ''}`;
            
            const completionEntry = isCompletedToday ? habit.completionDates.find(c => c.date === todayDate) : null;
            const timeDisplay = completionEntry ? `<small class="time-stamp">Completed: ${completionEntry.time}</small>` : '';

            habitItem.innerHTML = `
                <span>${habit.name}</span>
                ${timeDisplay}
                <div class="habit-actions">
                    <button class="complete-btn" data-id="${habit.id}">
                        ${isCompletedToday ? 'Undo' : 'Complete'}
                    </button>
                    <button class="delete-btn" data-id="${habit.id}" aria-label="Delete habit">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            `;
            
            habitItem.querySelector('.complete-btn').addEventListener('click', handleHabitCompletion);
            habitItem.querySelector('.delete-btn').addEventListener('click', handleHabitDeletion); 
            
            habitList.appendChild(habitItem);
        });
    };

    const handleHabitCompletion = (e) => {
        const button = e.target;
        const habitId = parseInt(button.dataset.id); 
        const habit = habits.find(h => h.id === habitId);
        const todayDate = getTodayDateString();
        const nowTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

        if (!habit) return;

        const index = habit.completionDates.findIndex(c => c.date === todayDate);

        if (index === -1) {
            habit.completionDates.push({ date: todayDate, time: nowTime });
        } else {
            habit.completionDates.splice(index, 1);
        }

        saveHabits();
        renderHabits();
        updateProgressStats(); 
        renderCalendar(); 
    };

    const getPerfectDays = () => {
        const totalHabits = habits.length;
        if (totalHabits === 0) return { perfectDays: new Set(), longestStreak: 0 };

        const dailyCounts = {};
        habits.forEach(habit => {
            habit.completionDates.forEach(comp => {
                dailyCounts[comp.date] = (dailyCounts[comp.date] || 0) + 1;
            });
        });

        const perfectDaysArray = Object.keys(dailyCounts).filter(date => dailyCounts[date] === totalHabits);
        
        let maxStreak = 0;
        let currentStreak = 0;
        
        perfectDaysArray.sort((a, b) => new Date(a) - new Date(b));
        
        for (let i = 0; i < perfectDaysArray.length; i++) {
            const today = new Date(perfectDaysArray[i]);
            
            if (i === 0) {
                currentStreak = 1;
            } else {
                const yesterday = new Date(perfectDaysArray[i - 1]);
                const diffTime = Math.abs(today - yesterday);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                
                if (diffDays === 1) { 
                    currentStreak++;
                } else if (diffDays > 1) {
                    currentStreak = 1; 
                }
            }
            maxStreak = Math.max(maxStreak, currentStreak);
        }

        return { perfectDays: new Set(perfectDaysArray), longestStreak: maxStreak };
    };

    const updateProgressStats = () => {
        const { perfectDays, longestStreak } = getPerfectDays();

        perfectDaysSpan.textContent = perfectDays.size;
        longestStreakSpan.textContent = longestStreak;
    };
    
    const showCalendarDetails = (dateString) => {
        modalHabitDetails.innerHTML = '';
        modalDateHeader.textContent = `Habit Status for ${dateString}`;
        
        const completedHabits = habits.filter(h => 
            h.completionDates.some(c => c.date === dateString)
        );
        const missedHabits = habits.filter(h => 
            !h.completionDates.some(c => c.date === dateString)
        );

        if (habits.length === 0) {
            modalHabitDetails.innerHTML = '<p>No habits tracked yet.</p>';
        } else {
             
            completedHabits.forEach(habit => {
                const completion = habit.completionDates.find(c => c.date === dateString);
                const p = document.createElement('p');
                p.className = 'completed-item';
                p.innerHTML = `<i class="fas fa-check-circle"></i> <strong>${habit.name}</strong> (at ${completion.time})`;
                modalHabitDetails.appendChild(p);
            });
            
            missedHabits.forEach(habit => {
                const p = document.createElement('p');
                p.className = 'missed-item';
                p.innerHTML = `<i class="fas fa-times-circle"></i> ${habit.name} (Missed)`;
                modalHabitDetails.appendChild(p);
            });
        }

        modal.classList.remove('hidden');
    };

    const renderCalendar = () => {
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

        currentMonthYearSpan.textContent = `${monthNames[currentMonth]} ${currentYear}`;
        calendarView.innerHTML = '';
        
        const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay(); 
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate(); 

        const { perfectDays } = getPerfectDays();

        dayLabels.forEach(label => {
            const dayLabel = document.createElement('div');
            dayLabel.className = 'day-label';
            dayLabel.textContent = label;
            calendarView.appendChild(dayLabel);
        });

        for (let i = 0; i < firstDayOfMonth; i++) {
            const blankDay = document.createElement('div');
            blankDay.className = 'calendar-day inactive';
            calendarView.appendChild(blankDay);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const currentDate = new Date(currentYear, currentMonth, day);
            const dateString = formatDate(currentDate);
            
            const calendarDay = document.createElement('div');
            calendarDay.className = 'calendar-day';
            calendarDay.textContent = day;

            if (perfectDays.has(dateString)) {
                calendarDay.classList.add('completed-day');
            }
            
            calendarDay.addEventListener('click', () => {
              
                if (calendarDay.classList.contains('inactive')) return; 
                showCalendarDetails(dateString);
            });

            calendarView.appendChild(calendarDay);
        }
    };

    const switchTab = (tabId) => {
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.add('hidden-tab'));

        const activeTabButton = document.querySelector(`.tab-button[data-tab="${tabId}"]`);
        const activeTabContent = document.getElementById(tabId);
        
        if (activeTabButton && activeTabContent) {
            activeTabButton.classList.add('active');
            activeTabContent.classList.remove('hidden-tab');
        }

        if (tabId === 'progress') {
            updateProgressStats();
            renderCalendar();
        }
    };
    

    const initializeMainApp = () => {
        renderHabits(); 
        displayRandomQuote(); 
        displayUsername(); 
        switchTab('habits');
        startReminderCheck(); 
    };

    const checkAuthStateAndNavigate = () => {
        const isUserLoggedIn = localStorage.getItem(USERNAME_KEY);
        
        applySavedTheme();
        
        if (logoutButton) {
             if (isUserLoggedIn) {
                logoutButton.classList.remove('hidden');
            } else {
                logoutButton.classList.add('hidden');
            }
        }

        if (isUserLoggedIn) {
            loginContainer.classList.add('hidden');
            introScreen.classList.add('hidden');
            mainContainer.classList.remove('hidden');
            
            initializeMainApp();
        } else {
            loginContainer.classList.remove('hidden');
            introScreen.classList.add('hidden');
            mainContainer.classList.add('hidden');
        }
    };
    
    loginButton.addEventListener('click', () => {
        const usernameInputEl = document.getElementById('username');
        const passwordInputEl = document.getElementById('password');
        const usernameInput = usernameInputEl.value.trim();
        const passwordInput = passwordInputEl.value;
        const validUsername = 'ritiktyagi';
        const validPassword = '123';
        const hasSeenIntro = localStorage.getItem(INTRO_SEEN_KEY); 

        if (usernameInput === validUsername && passwordInput === validPassword) {
            loginMessage.textContent = 'Login successful!';
            loginMessage.style.color = 'green';
            localStorage.setItem(USERNAME_KEY, usernameInput); 
            
            setTimeout(() => {
                loginContainer.classList.add('hidden');

                if (hasSeenIntro) {
                    checkAuthStateAndNavigate(); 
                } else {
                    introScreen.classList.remove('hidden');
                }
                passwordInputEl.value = ''; 
            }, 500); 
            
        } else {
            loginMessage.textContent = 'Invalid username or password.';
            loginMessage.style.color = 'red'; 
        }
    });

    startButton.addEventListener('click', () => {
        localStorage.setItem(INTRO_SEEN_KEY, 'true');
        introScreen.classList.add('hidden');
        
        setTimeout(() => { 
            checkAuthStateAndNavigate(); 
        }, 500); 
    });

    addHabitButton.addEventListener('click', () => {
        const habitText = habitInput.value.trim();
        
        if (habitText !== "") {
            const newHabit = {
                
                id: Date.now() + Math.floor(Math.random() * 1000), 
                name: habitText,
                completionDates: [] 
            };
            
            habits.push(newHabit);
            saveHabits();
            habitInput.value = '';
            renderHabits();
        }
    });

    const handleLogout = () => {
        localStorage.removeItem(USERNAME_KEY);
        
        habits = JSON.parse(localStorage.getItem('habits')) || []; 
        
        disableReminder();

        checkAuthStateAndNavigate();
    };

    const applySavedTheme = () => {
        const savedTheme = localStorage.getItem(THEME_KEY);
        const themeIcon = themeButton.querySelector('i');

        if (savedTheme === 'dark') {
            body.classList.add('dark-mode');
            if (themeIcon) themeIcon.className = 'fas fa-moon';
        } else {
            body.classList.remove('dark-mode');
            if (themeIcon) themeIcon.className = 'fas fa-sun';
        }
    };
    
    themeButton.addEventListener('click', () => {
        body.classList.toggle('dark-mode');
        const isDarkMode = body.classList.contains('dark-mode');
        const themeIcon = themeButton.querySelector('i');
        
        localStorage.setItem(THEME_KEY, isDarkMode ? 'dark' : 'light');
        
        if (themeIcon) {
            themeIcon.className = isDarkMode ? 'fas fa-moon' : 'fas fa-sun';
        }
    });
    
    prevMonthButton.addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        renderCalendar();
    });

    nextMonthButton.addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        renderCalendar();
    });

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.dataset.tab;
            switchTab(tabId);
        });
    });

    setReminderButton.addEventListener('click', async () => {
        const timeValue = reminderTimeInput.value;
        const purposeValue = reminderPurposeInput.value.trim();
        
        if (!parseAMPMTime(timeValue)) {
            reminderMessage.textContent = "Invalid format. Use HH:MM:SS AM/PM (e.g., 09:30:00 AM).";
            reminderMessage.style.color = 'red';
            return;
        }

        if (!purposeValue) {
            reminderMessage.textContent = "Please enter a purpose for the reminder.";
            reminderMessage.style.color = 'red';
            return;
        }

        const hasPermission = await requestNotificationPermission();
        if (hasPermission) {
            scheduleDailyReminder(timeValue, purposeValue);
        }
    });
    
    disableReminderButton.addEventListener('click', disableReminder);

    closeModal.addEventListener('click', () => {
        modal.classList.add('hidden');
    });

    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.classList.add('hidden');
        }
    });

    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }
    
    checkAuthStateAndNavigate(); 
});