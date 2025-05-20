export class ResultsPhaseManager {
    constructor(sessionState, domElements, aiService, uiManager) {
        this.sessionState = sessionState;
        this.domElements = domElements;
        this.aiService = aiService;
        this.uiManager = uiManager;
    }
    
    async displayResults() {
        // Display all rounds' questions and answers
        this.displayAllRoundsQuestionsAndAnswers();
        
        // Generate AI analysis
        await this.generateAiAnalysis();
        
        // Update the new session button text based on round
        this.domElements.newSessionBtn.textContent = `Start Round ${this.sessionState.round + 1}`;
        
        // Celebrate completion
        this.celebrateCompletion();
    }
    
    displayAllRoundsQuestionsAndAnswers() {
        const allRoundsContainer = this.domElements.allRoundsContainer;
        allRoundsContainer.innerHTML = '';
        
        // Display previous rounds
        this.sessionState.previousRounds.forEach(prevRound => {
            const roundSection = document.createElement('div');
            roundSection.className = 'round-results';
            
            const roundHeader = document.createElement('h3');
            roundHeader.textContent = `Round ${prevRound.round} Questions & Ideas`;
            roundSection.appendChild(roundHeader);
            
            const questionsList = document.createElement('div');
            questionsList.className = 'questions-list';
            
            for (let i = 0; i < prevRound.questions.length; i++) {
                const questionKey = `question_${i}`;
                const question = prevRound.questions[i].question;
                const ideas = prevRound.ideas[questionKey] || [];
                
                const questionItem = document.createElement('div');
                questionItem.className = 'question-item';
                
                questionItem.innerHTML = `
                    <div class="question-header">${question}</div>
                    <ul class="question-ideas">
                        ${ideas.length > 0 
                            ? ideas.map(idea => `<li>${idea}</li>`).join('') 
                            : '<li class="no-ideas">No ideas recorded</li>'}
                    </ul>
                `;
                
                questionsList.appendChild(questionItem);
            }
            
            roundSection.appendChild(questionsList);
            allRoundsContainer.appendChild(roundSection);
        });
        
        // Display current round
        const currentRoundSection = document.createElement('div');
        currentRoundSection.className = 'round-results current-round';
        
        const currentRoundHeader = document.createElement('h3');
        currentRoundHeader.textContent = `Round ${this.sessionState.round} Questions & Ideas`;
        currentRoundSection.appendChild(currentRoundHeader);
        
        const currentQuestionsList = document.createElement('div');
        currentQuestionsList.className = 'questions-list';
        
        for (let i = 0; i < this.sessionState.questions.length; i++) {
            const questionKey = `question_${i}`;
            const question = this.sessionState.questions[i].question;
            const ideas = this.sessionState.ideas[questionKey] || [];
            
            const questionItem = document.createElement('div');
            questionItem.className = 'question-item';
            
            questionItem.innerHTML = `
                <div class="question-header">${question}</div>
                <ul class="question-ideas">
                    ${ideas.length > 0 
                        ? ideas.map(idea => `<li>${idea}</li>`).join('') 
                        : '<li class="no-ideas">No ideas recorded</li>'}
                </ul>
            `;
            
            currentQuestionsList.appendChild(questionItem);
        }
        
        currentRoundSection.appendChild(currentQuestionsList);
        allRoundsContainer.appendChild(currentRoundSection);
    }
    
    async generateAiAnalysis() {
        // Show loading state
        this.domElements.aiAnalysis.innerHTML = `
            <div class="loading-spinner"></div>
            <p>AI is analyzing your Round ${this.sessionState.round} brainstorming results...</p>
        `;
        
        // Get the AI analysis
        const formattedAnalysis = await this.aiService.generateAiAnalysis();
        
        // Display the analysis
        this.domElements.aiAnalysis.innerHTML = `
            <h3>AI Analysis of Round ${this.sessionState.round}</h3>
            <p>${formattedAnalysis}</p>
        `;
    }
    
    celebrateCompletion() {
        // Use confetti from import map
        import('confetti').then(confettiModule => {
            const confetti = confettiModule.default;
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
        }).catch(err => console.error('Could not load confetti:', err));
    }
    
    startNextRound() {
        // Store current round data in previous rounds
        this.sessionState.resetForNewRound();
        
        // Update UI for next round
        this.uiManager.prepareSetupForNextRound(this.sessionState);
        
        // Switch back to setup phase
        this.uiManager.switchToSetupPhase();
    }
}