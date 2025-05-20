export class ExportManager {
    constructor(sessionState, domElements) {
        this.sessionState = sessionState;
        this.domElements = domElements;
    }
    
    copyResultsToClipboard() {
        const resultsText = this.generateResultsText();
        navigator.clipboard.writeText(resultsText)
            .then(() => {
                alert('Results copied to clipboard!');
            })
            .catch(err => {
                console.error('Failed to copy: ', err);
                alert('Failed to copy results to clipboard');
            });
    }

    downloadResultsAsCSV() {
        const csvContent = this.generateCSV();
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `brainstorm-${this.sessionState.focus.substring(0, 20).replace(/[^a-z0-9]/gi, '-').toLowerCase()}-round-${this.sessionState.round}-${new Date().toISOString().slice(0, 10)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    generateCSV() {
        let csv = `"Round","Question","Idea","Challenge"\n`;
        
        // Add previous rounds data
        this.sessionState.previousRounds.forEach(prevRound => {
            for (let i = 0; i < prevRound.questions.length; i++) {
                const question = prevRound.questions[i].question.replace(/"/g, '""');
                const questionKey = `question_${i}`;
                const ideas = prevRound.ideas[questionKey] || [];
                
                if (ideas.length === 0) {
                    csv += `"${prevRound.round}","${question}","No ideas recorded",""\n`;
                } else {
                    ideas.forEach(idea => {
                        const escapedIdea = idea.replace(/"/g, '""');
                        const challenge = prevRound.challenges && 
                                        prevRound.challenges[questionKey] && 
                                        prevRound.challenges[questionKey][idea] 
                                        ? prevRound.challenges[questionKey][idea].replace(/"/g, '""') 
                                        : '';
                        csv += `"${prevRound.round}","${question}","${escapedIdea}","${challenge}"\n`;
                    });
                }
            }
        });
        
        // Add current round data
        for (let i = 0; i < this.sessionState.questions.length; i++) {
            const question = this.sessionState.questions[i].question.replace(/"/g, '""');
            const questionKey = `question_${i}`;
            const ideas = this.sessionState.ideas[questionKey] || [];
            
            if (ideas.length === 0) {
                csv += `"${this.sessionState.round}","${question}","No ideas recorded",""\n`;
            } else {
                ideas.forEach(idea => {
                    const escapedIdea = idea.replace(/"/g, '""');
                    const challenge = this.sessionState.challenges && 
                                    this.sessionState.challenges[questionKey] && 
                                    this.sessionState.challenges[questionKey][idea] 
                                    ? this.sessionState.challenges[questionKey][idea].replace(/"/g, '""') 
                                    : '';
                    csv += `"${this.sessionState.round}","${question}","${escapedIdea}","${challenge}"\n`;
                });
            }
        }
        
        return csv;
    }

    generateResultsText() {
        let text = `Brainstorming Session Results: ${this.sessionState.focus} - Round ${this.sessionState.round}\n`;
        text += `Total Time: ${this.sessionState.totalTime} minutes\n\n`;
        
        // Add pinned ideas if any
        if (this.sessionState.pinnedIdeas.length > 0) {
            text += `PINNED IDEAS:\n`;
            this.sessionState.pinnedIdeas.forEach(idea => {
                text += `- ${idea}\n`;
            });
            text += '\n';
        }
        
        // Add ideas by question
        for (let i = 0; i < this.sessionState.questions.length; i++) {
            const question = this.sessionState.questions[i].question;
            const questionKey = `question_${i}`;
            const ideas = this.sessionState.ideas[questionKey] || [];
            
            text += `QUESTION ${i+1}: ${question}\n`;
            
            if (ideas.length === 0) {
                text += `- No ideas recorded for this question\n`;
            } else {
                ideas.forEach(idea => {
                    text += `- ${idea}\n`;
                    
                    // Add challenges if any
                    if (this.sessionState.challenges && 
                        this.sessionState.challenges[questionKey] && 
                        this.sessionState.challenges[questionKey][idea]) {
                        text += `  CHALLENGE: ${this.sessionState.challenges[questionKey][idea]}\n`;
                    }
                });
            }
            
            text += '\n';
        }
        
        // Get AI analysis text
        const analysisEl = document.querySelector('#ai-analysis');
        if (analysisEl && !analysisEl.querySelector('.loading-spinner')) {
            text += `AI ANALYSIS OF ROUND ${this.sessionState.round}:\n${analysisEl.textContent.replace(/\s+/g, ' ').trim()}\n`;
        }
        
        return text;
    }
}