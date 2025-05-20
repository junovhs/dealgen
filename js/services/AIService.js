// ===== FILE: dealgen/js/services/AIService.js ===== //
export class AIService {
    constructor(sessionState) {
        this.sessionState = sessionState;
        this.apiEndpoint = '/api/generate'; // Your backend endpoint
    }

    /**
     * Private helper method to call the backend API.
     * @param {object} payload - The data to send to the AI, e.g., { messages: [], json?: boolean }
     * @returns {Promise<object>} - The JSON response from the backend, expected to be { content: "..." }
     */
    async _callApi(payload) {
        try {
            console.log(`AIService: Calling ${this.apiEndpoint} with payload:`, JSON.stringify(payload));
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload), // Send the whole payload (messages, json flag)
            });

            if (!response.ok) {
                let errorData;
                try {
                    errorData = await response.json(); // Try to parse error response as JSON
                } catch (e) {
                    // If not JSON, use text
                    errorData = { details: await response.text() || `API request failed with status ${response.status}` };
                }
                console.error('AIService: API request failed:', errorData);
                throw new Error(errorData.details || `API request failed with status ${response.status}`);
            }
            const result = await response.json(); // The backend should return { content: "..." }
            console.log('AIService: Received from API:', result);
            return result;
        } catch (error) {
            console.error('AIService: Error calling backend API:', error);
            throw error; // Re-throw to be caught by calling methods
        }
    }

    async generateAiQuestions() {
        try {
            const contextPrompt = `
                SITUATION: ${this.sessionState.contextSituation}
                GOAL: ${this.sessionState.contextGoal}
                CHALLENGES: ${this.sessionState.contextChallenges}
            `;
            
            const structurePrompt = this.sessionState.round === 1 
                ? `You're helping the user brainstorm with this context:
                   ${contextPrompt}
                   
                   Generate a series of ${this.sessionState.questionsPerRound} thought-provoking questions that will guide their brainstorming in a structured way toward achieving their goal. 
                   Start with broader questions and then get more specific. Make each question directly related to the context and goal provided.
                   For each question, also provide a brief (1-2 sentence) explanation of why this question is important.
                   Additionally, provide 3 example answers for each question that would help the user understand what kind of responses are expected.` 
                : `You're helping refine a brainstorming session in Round ${this.sessionState.round}.
                   Original context:
                   ${contextPrompt}
                   
                   Based on the previous round's ideas: ${JSON.stringify(this.sessionState.getAllIdeasFromPreviousRound())},
                   and these pinned important ideas: ${JSON.stringify(this.sessionState.pinnedIdeas)},
                   generate ${this.sessionState.questionsPerRound} more focused follow-up questions that will help deepen the brainstorming.
                   These questions should build on the strongest ideas, explore gaps, and help push thinking further.
                   For each question, provide a brief (1-2 sentence) explanation of why this follow-up question is important.
                   Additionally, provide 3 example answers for each question that would help the user understand what kind of responses are expected.`;
            
            const formatInstructions = `Format your response as JSON with this structure:
            {
              "questions": [
                { 
                  "question": "The question text here?", 
                  "explanation": "Brief explanation of why this question matters",
                  "suggestionPills": ["Complete sentence example answer 1 (8-15 words)", "Complete sentence example answer 2 (8-15 words)", "Complete sentence example answer 3 (8-15 words)"]
                }
              ]
            }`;
            
            // This is what we send to your /api/generate endpoint
            const requestPayload = {
                messages: [
                    { role: "system", content: structurePrompt + formatInstructions },
                    { role: "user", content: this.sessionState.round === 1 
                        ? `I want to brainstorm about achieving ${this.sessionState.contextGoal} and I have ${this.sessionState.totalTime} minutes.`
                        : `I'm continuing to brainstorm about ${this.sessionState.contextGoal} in Round ${this.sessionState.round}.`
                    }
                ],
                json: true // We expect the 'content' field from the API to be a JSON string
            };

            const apiResponse = await this._callApi(requestPayload);

            // apiResponse.content is expected to be a JSON string from your API
            const content = JSON.parse(apiResponse.content); 
            this.sessionState.questions = content.questions;
            
            this.sessionState.conversationHistory.push({
                role: "user",
                content: requestPayload.messages.find(m => m.role === "user").content
            });
            
            this.sessionState.conversationHistory.push({
                role: "assistant",
                content: `I'll guide Round ${this.sessionState.round} of your brainstorming session about "${this.sessionState.contextGoal}" with ${this.sessionState.questions.length} structured questions.`
            });
            
            return this.sessionState.questions;
            
        } catch (error) {
            console.error('Error generating AI questions:', error);
            // Fallback questions if API fails
            this.sessionState.questions = [];
            const numQuestions = this.sessionState.questionsPerRound || 4; // Default to 4 if not set
            
            const defaultQuestions = [
                { 
                    question: `Fallback: What are the main challenges related to ${this.sessionState.contextGoal}?`,
                    explanation: "Understanding challenges helps identify opportunities for improvement.",
                    suggestionPills: ["Financial constraints", "Team expertise", "Time constraints"]
                },
                {
                    question: `Fallback: What solutions have you already tried regarding ${this.sessionState.contextGoal}?`,
                    explanation: "Reflecting on past attempts prevents repeating unsuccessful strategies.",
                    suggestionPills: ["Research", "Consulting experts", "Internally developed solutions"]
                },
                {
                    question: `Fallback: Who are the key stakeholders affected by ${this.sessionState.contextGoal}, and what are their needs?`,
                    explanation: "Considering different perspectives leads to more comprehensive solutions.",
                    suggestionPills: ["Customers", "Team members", "Investors"]
                },
                {
                    question: `Fallback: What would an ideal outcome for ${this.sessionState.contextGoal} look like?`,
                    explanation: "Defining success creates a clear target for your ideas.",
                    suggestionPills: ["Increased revenue", "Improved customer satisfaction", "Enhanced efficiency"]
                }
            ];
            
            for (let i = 0; i < Math.min(numQuestions, defaultQuestions.length); i++) {
                this.sessionState.questions.push(defaultQuestions[i % defaultQuestions.length]); // Cycle through defaults if numQuestions is higher
            }
            
            return this.sessionState.questions;
        }
    }
    
    async generateAiQuestionReview() {
        try {
            if (this.sessionState.currentQuestionIndex === 0 && !this.sessionState.ideas['question_0']?.length) {
                return null; // No review for the very first question if no ideas yet
            }

            const currentIdeas = {};
            for (let i = 0; i <= this.sessionState.currentQuestionIndex; i++) {
                const questionKey = `question_${i}`;
                // Ensure the question exists before trying to access its text
                if (this.sessionState.questions[i] && this.sessionState.questions[i].question) {
                     currentIdeas[this.sessionState.questions[i].question] = this.sessionState.ideas[questionKey] || [];
                }
            }

            const reviewPrompt = `You're reviewing a brainstorming session about "${this.sessionState.focus}" in Round ${this.sessionState.round}.
            We've just completed question ${this.sessionState.currentQuestionIndex + 1} of ${this.sessionState.questions.length}.
            
            Here are the questions and ideas generated so far:
            ${JSON.stringify(currentIdeas, null, 2)}
            
            ${this.sessionState.pinnedIdeas.length > 0 ? `Important pinned ideas: ${JSON.stringify(this.sessionState.pinnedIdeas)}` : ''}
            
            Create a brief (2-3 sentence) progress update. Comment on:
            1. How the brainstorming is progressing
            2. Any patterns or insights emerging
            3. What direction might be helpful for upcoming questions
            
            Be conversational and insightful. If ideas are sparse, encourage more divergent thinking. If many ideas are flowing, acknowledge the productivity.
            Sometimes be tactical ("Let's explore X further"), sometimes be reflective ("Interesting how Y keeps coming up").
            Use proper HTML instead of markdown for any formatting you want to apply. For emphasis, use <strong> or <em> tags instead of asterisks.`;

            const requestPayload = {
                messages: [
                    { role: "system", content: reviewPrompt },
                    { role: "user", content: `Review our brainstorming progress after question ${this.sessionState.currentQuestionIndex + 1}` }
                ]
                // No json: true here, so we expect direct HTML/text content from the API's "content" field
            };

            const apiResponse = await this._callApi(requestPayload);

            return apiResponse.content; // content is the direct HTML/text string from your API
            
        } catch (error) {
            console.error('Error generating AI question review:', error);
            // Fallback message if AI fails
            return `Round ${this.sessionState.round}: Continuing to brainstorm about "${this.sessionState.focus}" (AI review generation failed).`;
        }
    }
    
    async generateAiAnalysis() {
        try {
            const ideasData = {};
            for (let i = 0; i < this.sessionState.questions.length; i++) {
                const questionKey = `question_${i}`;
                // Ensure the question exists
                if (this.sessionState.questions[i] && this.sessionState.questions[i].question) {
                    ideasData[this.sessionState.questions[i].question] = this.sessionState.ideas[questionKey] || [];
                }
            }
            
            const analysisPrompt = `You're analyzing results from Round ${this.sessionState.round} of a brainstorming session about "${this.sessionState.focus}".
            Here are the questions and ideas generated for each:
            ${JSON.stringify(ideasData, null, 2)}
            
            ${this.sessionState.round > 1 ? `This is a follow-up round, building on ideas from the previous round.
            Pinned important ideas from previous rounds: ${JSON.stringify(this.sessionState.pinnedIdeas)}` : ''}
            
            Provide a comprehensive analysis with these sections (use HTML for formatting):
            <h3>Summary of key themes from Round ${this.sessionState.round}</h3>
            <p>...</p>
            <h3>Most promising ideas (2-3 ideas that stand out)</h3>
            <p>...</p>
            <h3>Potential next steps (3-5 concrete actions)</h3>
            <p>...</p>
            <h3>Areas that might need further exploration in the next round</h3>
            <p>...</p>
            
            Make your analysis specific and actionable. Highlight connections between ideas where relevant.`;
            
            const requestPayload = {
                messages: [
                    { role: "system", content: analysisPrompt },
                    { role: "user", content: `Analyze our Round ${this.sessionState.round} brainstorming session about "${this.sessionState.focus}"` }
                ]
                // No json: true, expects direct HTML content in API's "content" field
            };

            const apiResponse = await this._callApi(requestPayload);
            
            // The content is already expected to be formatted HTML from your API
            return apiResponse.content;
            
        } catch (error) {
            console.error('Error generating AI analysis:', error);
            return `
                <p>You brainstormed about "${this.sessionState.focus}" with ${Object.values(this.sessionState.ideas).flat().length} ideas across ${this.sessionState.questions.length} questions.</p>
                <p>We couldn't generate a detailed AI analysis due to an API error, but you can review your ideas in the exported results.</p>
            `;
        }
    }
}
// ===== END dealgen/js/services/AIService.js ===== //