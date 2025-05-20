import { ResultsPhaseManager } from './ResultsPhaseManager.js';

export class BrainstormPhaseManager {
    constructor(sessionState, domElements, aiService, timerManager, ideasManager, uiManager) {
        this.sessionState = sessionState;
        this.domElements = domElements;
        this.aiService = aiService;
        this.timerManager = timerManager;
        this.ideasManager = ideasManager;
        this.uiManager = uiManager;
    }
    
    startQuestionTimer() {
        const currentQuestion = this.sessionState.questions[this.sessionState.currentQuestionIndex];
        this.domElements.currentTopicElement.textContent = `Round ${this.sessionState.round} - Question ${this.sessionState.currentQuestionIndex + 1} of ${this.sessionState.questions.length}`;
        
        // Display the question with typing animation
        this.uiManager.showTypingAnimation();
        setTimeout(() => {
            this.domElements.aiPromptElement.innerHTML = `
                <p class="question-text">${currentQuestion.question}</p>
                <p class="question-explanation">${currentQuestion.explanation}</p>
                <div class="suggestion-pills">
                    ${currentQuestion.suggestionPills.map(pill => 
                        `<button class="suggestion-pill" data-value="${pill}">${pill}</button>`
                    ).join('')}
                    <button id="generate-more-pills" class="generate-more-pills">
                        <svg viewBox="0 0 24 24" width="16" height="16"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor"/></svg>
                        More ideas
                    </button>
                </div>
            `;
            this.domElements.aiPromptElement.classList.add('active');
            
            // Add click event listeners to the suggestion pills
            this.domElements.aiPromptElement.querySelectorAll('.suggestion-pill').forEach(pill => {
                pill.addEventListener('click', (e) => {
                    const suggestionText = e.target.dataset.value;
                    this.ideasManager.addIdea(suggestionText);
                });
            });
            
            // Add click event listener to the "generate more pills" button
            const moreButton = this.domElements.aiPromptElement.querySelector('#generate-more-pills');
            if (moreButton) {
                moreButton.addEventListener('click', () => this.generateMoreSuggestions(currentQuestion));
            }
        }, 1500);
        
        // Clear previous ideas display
        this.ideasManager.clearIdeasDisplay();
        this.domElements.ideasInput.value = '';
        this.domElements.ideasInput.focus();
        
        // Display existing ideas for this question
        this.ideasManager.displayCurrentQuestionIdeas();
        
        // Reset timer
        this.sessionState.timeRemaining = this.sessionState.timePerQuestion;
        this.timerManager.startTimer();
    }
    
    async generateMoreSuggestions(currentQuestion) {
        const moreButton = this.domElements.aiPromptElement.querySelector('#generate-more-pills');
        if (moreButton) {
            // Show loading state
            moreButton.innerHTML = `<div class="small-spinner"></div> Generating...`;
            moreButton.disabled = true;
            
            try {
                // Show a realistic "thinking" delay
                await new Promise(resolve => setTimeout(resolve, 4000));
                
                // Generate 3 new suggestions based on existing ones
                const currentIdeas = currentQuestion.suggestionPills;
                const completion = await websim.chat.completions.create({
                    messages: [
                        { 
                            role: "system", 
                            content: `You're helping with a brainstorming session about "${this.sessionState.focus}".
                            The current question is: "${currentQuestion.question}"
                            Previous suggestion ideas were: ${JSON.stringify(currentIdeas)}.
                            The user wants more ideas because they didn't find these suggestions helpful enough.
                            Generate 3 NEW, more creative and thoughtful suggestion ideas for this question.
                            Each idea should be a complete sentence or phrase (about 8-15 words) that directly answers the question.
                            Be specific, insightful, and potentially unexpected in your answers.
                            Format as JSON array with just the text of each idea.`
                        },
                        { 
                            role: "user", 
                            content: `Generate 3 fresh, thoughtful suggestions for: "${currentQuestion.question}"`
                        }
                    ],
                    json: true
                });
                
                const newIdeas = JSON.parse(completion.content);
                
                // Add new pills to the UI
                const pillsContainer = this.domElements.aiPromptElement.querySelector('.suggestion-pills');
                moreButton.remove(); // Remove the old button
                
                // Create a function to add pills with animation
                const addPillWithAnimation = (idea, index) => {
                    const pill = document.createElement('button');
                    pill.className = 'suggestion-pill new-pill';
                    pill.dataset.value = idea;
                    pill.style.opacity = '0';
                    pill.style.transform = 'translateX(-5px)';
                    pillsContainer.appendChild(pill);
                    
                    // Animate in the text word by word
                    const words = idea.split(' ');
                    let displayedText = '';
                    let wordIndex = 0;
                    
                    const animateNextWord = () => {
                        if (wordIndex < words.length) {
                            displayedText += (wordIndex > 0 ? ' ' : '') + words[wordIndex];
                            pill.textContent = displayedText;
                            wordIndex++;
                            setTimeout(animateNextWord, 150);
                        } else {
                            // When done, add the click event
                            pill.addEventListener('click', () => {
                                this.ideasManager.addIdea(idea);
                            });
                        }
                    };
                    
                    // Start animations with staggered timing
                    setTimeout(() => {
                        pill.style.transition = 'opacity 0.3s, transform 0.3s';
                        pill.style.opacity = '1';
                        pill.style.transform = 'translateX(0)';
                        animateNextWord();
                    }, index * 300);
                };
                
                // Add each pill with animation
                newIdeas.forEach((idea, index) => {
                    addPillWithAnimation(idea, index);
                });
                
                // Add a new "more ideas" button at the end after all pills are added
                setTimeout(() => {
                    const newMoreButton = document.createElement('button');
                    newMoreButton.id = 'generate-more-pills';
                    newMoreButton.className = 'generate-more-pills';
                    newMoreButton.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor"/></svg> More ideas`;
                    newMoreButton.style.opacity = '0';
                    newMoreButton.style.transform = 'translateX(-5px)';
                    pillsContainer.appendChild(newMoreButton);
                    
                    setTimeout(() => {
                        newMoreButton.style.transition = 'opacity 0.3s, transform 0.3s';
                        newMoreButton.style.opacity = '1';
                        newMoreButton.style.transform = 'translateX(0)';
                        newMoreButton.addEventListener('click', () => this.generateMoreSuggestions(currentQuestion));
                    }, 100);
                }, newIdeas.length * 300 + 200);
                
                // Add the new ideas to the question's suggestion pills
                currentQuestion.suggestionPills = [...currentQuestion.suggestionPills, ...newIdeas];
                
            } catch (error) {
                console.error('Error generating more suggestions:', error);
                moreButton.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor"/></svg> More ideas`;
                moreButton.disabled = false;
            }
        }
    }
    
    async skipToNextQuestion() {
        this.timerManager.stopTimer();
        
        // Generate AI review before moving to next question
        const reviewText = await this.aiService.generateAiQuestionReview();
        if (reviewText) {
            this.domElements.aiProgressComment.innerHTML = reviewText;
        }
        
        this.sessionState.currentQuestionIndex++;
        
        if (this.sessionState.currentQuestionIndex < this.sessionState.questions.length) {
            this.startQuestionTimer();
        } else {
            await this.finishSession();
        }
    }
    
    async finishSession() {
        // Switch to results phase
        this.uiManager.switchToResultsPhase();
        
        // Instantiate results phase manager to handle results display
        const resultsPhaseManager = new ResultsPhaseManager(
            this.sessionState, 
            this.domElements, 
            this.aiService, 
            this.uiManager
        );
        
        await resultsPhaseManager.displayResults();
    }
}