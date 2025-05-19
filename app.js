const { useState, useEffect } = React;

// Moved helper functions outside the component
const extractKeywords = (text) => {
  // Extract first word of headline and significant marketing words
  const words = text.split(/\s+/).map(word => word.toLowerCase().replace(/[.,!?;:]/g, ''));
  const firstWord = words[0];
  return [firstWord];
};

function DealChecklist() {
  const [deals, setDeals] = useState([]);
  const [inputText, setInputText] = useState("");
  const [aiProcessing, setAiProcessing] = useState({});
  const [notesInput, setNotesInput] = useState({});
  const [copySuccess, setCopySuccess] = useState({});
  const [overusedWords, setOverusedWords] = useState([]);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [generationStatus, setGenerationStatus] = useState("");
  const [aiGuidanceText, setAiGuidanceText] = useState(
    `Avoid marketing language that sounds spammy. Don't start with words like "Sail Away", "Unlock", "Score", "Indulge", "Savor", "Escape", "Dream". 
Keep headlines concise and conversational without "CTA: description" format.
Be straightforward and present the deals in few words.
Avoid hyperbole and excessive adjectives.

Industry terms you must always use: 

PPG = Free Gratuities 
OBC = Onboard Credit
PP = Per Person 

NEVER use rate codes. if there is a rate code, we dont need to share that, the sales agent they speak to will make sure its dealt with.

If a deal says "exclusive", you must ALWAYS BEGIN THE DEAL TITLE WITH "EXCLUSIVE:"`
  );
  const [isEditingGuidance, setIsEditingGuidance] = useState(false);

  const parseDeals = () => {
    const lines = inputText.split("\n");
    let parsedDeals = [];
    let currentVendor = "";

    lines.forEach(line => {
      const parts = line.split(/\s(.+)/);
      if (parts.length < 2) return;
      const [type, content] = parts;

      if (type === "v") {
        currentVendor = content;
        parsedDeals.push({ vendor: content, deals: [], isGeneratingAll: false });
      } else if ((type === "d" || type === "ed") && currentVendor) {
        if(parsedDeals.length > 0) {
            parsedDeals[parsedDeals.length - 1].deals.push({
              text: content,
              exclusive: type === "ed",
              checked: false,
              aiGenerated: null
            });
        }
      }
    });
    setDeals(parsedDeals);
  };

  const toggleDeal = (vendorIndex, dealIndex) => {
    setDeals(prevDeals => {
      const newDeals = [...prevDeals];
      newDeals[vendorIndex].deals[dealIndex].checked = !newDeals[vendorIndex].deals[dealIndex].checked;
      if (newDeals[vendorIndex].deals[dealIndex].checked) {
        if (typeof confetti === 'function') {
            confetti({
                particleCount: 150,
                spread: 80,
                colors: ['#3b82f6', '#10b981', '#8b5cf6']
            });
        } else {
            console.warn("Confetti function not found.");
        }
      }
      return newDeals;
    });
  };

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopySuccess({...copySuccess, [key]: true});
      setTimeout(() => {
        setCopySuccess(prev => {
          const newState = {...prev};
          delete newState[key];
          return newState;
        });
      }, 1500);
    });
  };

  const handleNotesInputChange = (vendorIndex, dealIndex, value) => {
    setNotesInput(prev => ({
      ...prev,
      [`${vendorIndex}-${dealIndex}`]: value
    }));
  };

  const handleNotesKeyDown = (e, vendorIndex, dealIndex, dealText) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      generateAIContent(vendorIndex, dealIndex, dealText);
    }
  };

  const updateOverusedWords = (newWords) => {
    setOverusedWords(prev => {
        const combined = [...prev, ...newWords];
        const unique = combined.filter((w, i, arr) =>
            w && w.length > 3 && arr.lastIndexOf(w) === i
        );
        return unique.slice(-20);
    });
  };

  const generateAIContent = async (vendorIndex, dealIndex, dealText) => {
    setAiProcessing(prev => ({...prev, [`${vendorIndex}-${dealIndex}`]: true}));
    const notes = notesInput[`${vendorIndex}-${dealIndex}`] || '';
    if (notes) {
      setNotesInput(prev => {
        const newState = {...prev};
        delete newState[`${vendorIndex}-${dealIndex}`];
        return newState;
      });
    }

    const VERCEL_API_PROXY_URL = '/api/generate'; // Relative path to your Vercel function

    const systemPromptContent = `You are a travel marketing expert. Transform travel promotions into engaging headlines and descriptions.
            ${aiGuidanceText}
            Important: For BOTH headline and description, replace PPG with "Free Gratuities", OBC with "Onboard Credit", and PP with "Per Person".
            Avoid these overused words: ${overusedWords.join(', ')}.
            Do NOT include expiry dates in your response, they will be added later.
            Respond directly with JSON, following this JSON schema, and no other text.
            {
              headline: string; // 8-12 highly descriptive words highlighting key benefit(s) or offer, focusing mostly on the raw details.
              description: string; // 14-16 words in friendly tone.
            }`;

    const userPromptContent = notes
              ? `Transform this travel promotion: "${dealText}". Consider these additional notes: "${notes}"`
              : `Transform this travel promotion: "${dealText}"`;

    const payloadToBackend = {
        messages: [
            {
                role: "system",
                content: systemPromptContent
            },
            {
                role: "user",
                content: userPromptContent
            }
        ]
    };

    try {
        const response = await fetch(VERCEL_API_PROXY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payloadToBackend),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({
                error: `API request failed with status ${response.status}`,
                details: response.statusText
            }));
            console.error("Error from backend proxy:", errorData);
            throw new Error(errorData.error || `API request failed: ${response.status}`);
        }

        const backendResponse = await response.json();

        if (!backendResponse.content) {
            console.error("Invalid response from backend, missing 'content':", backendResponse);
            throw new Error("Invalid response from AI service: Missing content.");
        }

        const result = JSON.parse(backendResponse.content);

        const newWords = extractKeywords(result.headline + " " + result.description);
        updateOverusedWords(newWords);

        const expiryInfo = typeof findExpiryDate === 'function' ? findExpiryDate(dealText) : null;
        let finalDescription = result.description;

        if (expiryInfo && expiryInfo.formattedShortDate) {
            if (!finalDescription.trim().endsWith('.')) {
                finalDescription = finalDescription.trim() + '.';
            }
            finalDescription += ` Ends ${expiryInfo.formattedShortDate}.`;
        }

        setDeals(prevDeals => {
            const newDeals = [...prevDeals];
            if (newDeals[vendorIndex] && newDeals[vendorIndex].deals[dealIndex]) {
                newDeals[vendorIndex].deals[dealIndex].aiGenerated = {
                    headline: result.headline,
                    description: finalDescription,
                };
            }
            return newDeals;
        });

    } catch (error) {
        console.error("Error generating AI content (in app.js):", error);
        alert(`Failed to generate AI content: ${error.message}`);
    } finally {
        setAiProcessing(prev => {
            const newState = {...prev};
            delete newState[`${vendorIndex}-${dealIndex}`];
            return newState;
        });
    }
  };

  const saveGuidance = () => {
    setIsEditingGuidance(false);
  };

  const generateAllDeals = async (vendorIndex) => {
    const vendor = deals[vendorIndex];

    setDeals(prevDeals => {
      const newDeals = [...prevDeals];
       if (newDeals[vendorIndex]) {
         newDeals[vendorIndex] = { ...newDeals[vendorIndex], isGeneratingAll: true };
       }
      return newDeals;
    });

    for (let dealIndex = 0; dealIndex < vendor.deals.length; dealIndex++) {
       if (!deals[vendorIndex] || !deals[vendorIndex].deals[dealIndex]) break;
      const deal = vendor.deals[dealIndex];
      if (deal.aiGenerated || aiProcessing[`${vendorIndex}-${dealIndex}`]) {
        continue;
      }
      await generateAIContent(vendorIndex, dealIndex, deal.text);
      if (dealIndex < vendor.deals.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    setDeals(prevDeals => {
      const newDeals = [...prevDeals];
       if (newDeals[vendorIndex]) {
           newDeals[vendorIndex] = { ...newDeals[vendorIndex], isGeneratingAll: false };
       }
      return newDeals;
    });
  };

  const generateAllVendorsDeals = async () => {
    if (deals.length === 0) return;
    
    setIsGeneratingAll(true);
    setGenerationStatus("Starting generation process...");
    
    try {
      for (let vendorIndex = 0; vendorIndex < deals.length; vendorIndex++) {
        const vendor = deals[vendorIndex];
        setGenerationStatus(`Processing ${vendor.vendor} (${vendorIndex + 1}/${deals.length})`);
        
        if (vendorIndex > 0) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        for (let dealIndex = 0; dealIndex < vendor.deals.length; dealIndex++) {
          setGenerationStatus(`Processing ${vendor.vendor}: Deal ${dealIndex + 1}/${vendor.deals.length}`);
          const deal = vendor.deals[dealIndex];
          if (deal.aiGenerated || aiProcessing[`${vendorIndex}-${dealIndex}`]) {
            continue;
          }
          await generateAIContent(vendorIndex, dealIndex, deal.text);
          if (dealIndex < vendor.deals.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 3000));
          }
        }
      }
      setGenerationStatus("All deals generated successfully!");
    } catch (error) {
      console.error("Error in global deal generation:", error);
      setGenerationStatus(`Error: ${error.message}`);
    } finally {
      setTimeout(() => {
        setIsGeneratingAll(false);
        setGenerationStatus("");
      }, 3000);
    }
  };

  return (
    <div className="container fade-in">
      <h1 className="app-title">Deal Checklist</h1>

      <div className="ai-guidance-box">
        <div className="ai-guidance-header">
          <h3>AI Content Generation Guidelines</h3>
          <button
            className="edit-guidance-button"
            onClick={() => setIsEditingGuidance(!isEditingGmidance)}
          >
            {isEditingGuidance ? 'Cancel' : 'Edit'}
          </button>
        </div>

        {isEditingGuidance ? (
          <div className="guidance-edit-container">
            <textarea
              className="guidance-textarea"
              value={aiGuidanceText}
              onChange={(e) => setAiGuidanceText(e.target.value)}
              rows={4} 
            />
            <button className="save-guidance-button" onClick={saveGuidance}>
              Apply Changes
            </button>
          </div>
        ) : (
          <div className="guidance-display">
            <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0 }}>{aiGuidanceText}</pre>
            <div className="overused-words">
              <span className="overused-label">Avoiding these words: </span>
              {overusedWords.length > 0 ? overusedWords.join(', ') : 'None tracked yet'}
            </div>
          </div>
        )}
      </div>

      <div className="textarea-container">
        <textarea
          placeholder="Paste your deal text here..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />
        <p className="help-text">
          Format: Use "v Vendor Name" for vendors, "d Deal Description" for regular deals,
          and "ed Exclusive Deal" for exclusive deals. Each on a new line.
        </p>
      </div>

      <div className="button-container">
        <button
          className="parse-button"
          onClick={parseDeals}
        >
          Parse Deals
        </button>
        
        {deals.length > 0 && (
          <button
            className="generate-all-vendors-button"
            onClick={generateAllVendorsDeals}
            disabled={isGeneratingAll}
          >
            Generate All Deals
            {isGeneratingAll && <span className="ai-loading"></span>}
          </button>
        )}
      </div>
      
      {generationStatus && (
        <div className="generation-status">
          {generationStatus}
        </div>
      )}

      {deals.length > 0 ? (
        <div className="deals-container">
          {deals.map((vendor, vendorIndex) => (
            <div key={vendorIndex} className="vendor-card fade-in">
              <div className="vendor-header">
                <h2 className="vendor-name">{vendor.vendor}</h2>
                <button
                  className="generate-all-button"
                  onClick={() => generateAllDeals(vendorIndex)}
                  disabled={vendor.isGeneratingAll || vendor.deals.some(
                    (_, dealIdx) => aiProcessing[`${vendorIndex}-${dealIdx}`]
                  )}
                >
                  AI Generate All
                  {vendor.isGeneratingAll && <span className="ai-loading"></span>}
                </button>
              </div>
              <div className="deals-list">
                {vendor.deals.map((deal, dealIndex) => (
                  <div key={dealIndex} className="deal-item">
                    <label className="checkbox">
                      <input
                        type="checkbox"
                        checked={deal.checked}
                        onChange={() => toggleDeal(vendorIndex, dealIndex)}
                      />
                      <span className="checkmark"></span>
                    </label>
                    <div>
                      <div style={{display: 'flex', alignItems: 'center'}}>
                        <span className={`deal-text ${deal.exclusive ? 'exclusive' : ''} ${deal.checked ? 'checked' : ''}`}>
                          {deal.text}
                        </span>
                        <button
                          className="ai-button"
                          onClick={() => deal.aiGenerated
                            ? setNotesInput(prev => ({
                              ...prev,
                              [`${vendorIndex}-${dealIndex}`]: prev[`${vendorIndex}-${dealIndex}`] === undefined ? "" : prev[`${vendorIndex}-${dealIndex}`]
                            }))
                            : generateAIContent(vendorIndex, dealIndex, deal.text)
                          }
                          disabled={aiProcessing[`${vendorIndex}-${dealIndex}`]}
                        >
                          {deal.aiGenerated ? 'AI+' : 'AI'}
                          {aiProcessing[`${vendorIndex}-${dealIndex}`] && <span className="ai-loading"></span>}
                        </button>
                      </div>

                      {notesInput[`${vendorIndex}-${dealIndex}`] !== undefined && (
                        <input
                          type="text"
                          className="notes-input"
                          placeholder="Add notes to improve AI generation and press Enter"
                          value={notesInput[`${vendorIndex}-${dealIndex}`]}
                          onChange={(e) => handleNotesInputChange(vendorIndex, dealIndex, e.target.value)}
                          onKeyDown={(e) => handleNotesKeyDown(e, vendorIndex, dealIndex, deal.text)}
                          autoFocus
                        />
                      )}

                      {deal.aiGenerated && (
                        <div className="ai-generated">
                          <div className="ai-content-row">
                            <div className="ai-headline">
                              {deal.aiGenerated.headline}
                            </div>
                            <div>
                              <button
                                className="copy-button"
                                onClick={() => copyToClipboard(
                                  deal.aiGenerated.headline, 
                                  `headline-${vendorIndex}-${dealIndex}`
                                )}
                              >
                                Copy Headline
                              </button>
                              {copySuccess[`headline-${vendorIndex}-${dealIndex}`] &&
                                <span className="copy-success">Copied!</span>
                              }
                            </div>
                          </div>
                          <div className="ai-content-row">
                            <div className="ai-description">
                              {deal.aiGenerated.description}
                            </div>
                            <div>
                              <button
                                className="copy-button"
                                onClick={() => copyToClipboard(deal.aiGenerated.description, `desc-${vendorIndex}-${dealIndex}`)}
                              >
                                Copy Description
                              </button>
                              {copySuccess[`desc-${vendorIndex}-${dealIndex}`] &&
                                <span className="copy-success">Copied!</span>
                              }
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-deals">
          No deals yet. Paste your text above and click "Parse Deals" to get started.
        </div>
      )}
    </div>
  );
}

ReactDOM.render(<DealChecklist />, document.getElementById("root"));