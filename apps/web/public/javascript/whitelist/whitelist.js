// apps/web/app/landing/app/javascript/whitelist/whitelist.js
console.log('Whitelist script loaded'); // Debug: Check if script loads

document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded, looking for email input'); // Debug: Check if DOM event fires
  
  const emailInput = document.getElementById('email');
  console.log('Email input found:', emailInput); // Debug: Check if element exists
  
  if (!emailInput) {
    console.error('Email input with id="email" not found!');
    return;
  }
  
  // Create container for input with submit button
  const inputContainer = document.createElement('div');
  inputContainer.className = 'email-input-container';
  inputContainer.style.position = 'relative';
  
  // Create submit button
  const submitButton = document.createElement('button');
  submitButton.className = 'email-submit-button';
  submitButton.innerHTML = '✓';
  submitButton.style.position = 'absolute';
  submitButton.style.right = '10px';
  submitButton.style.top = '50%';
  submitButton.style.transform = 'translateY(-50%)';
  submitButton.style.background = 'transparent';
  submitButton.style.border = 'none';
  submitButton.style.cursor = 'pointer';
  submitButton.style.fontSize = '18px';
  submitButton.style.color = '#333';
  submitButton.style.display = 'none';
  submitButton.style.transition = 'color 0.3s ease';
  submitButton.style.zIndex = '10';
  submitButton.style.padding = '5px';
  submitButton.style.minWidth = '30px';
  submitButton.style.minHeight = '30px';
  
  // Create error message element
  const errorDiv = document.createElement('div');
  errorDiv.className = 'email-error-message';
  errorDiv.style.color = '#ff6b6b';
  errorDiv.style.fontSize = '12px';
  errorDiv.style.marginTop = '4px';
  errorDiv.style.display = 'none';
  
  // Wrap the input with the container
  const parent = emailInput.parentElement;
  if (!parent) {
    console.error('Email input has no parent element');
    return;
  }
  
  parent.replaceChild(inputContainer, emailInput);
  inputContainer.appendChild(emailInput);
  inputContainer.appendChild(submitButton);
  
  // Insert error message after container
  parent.insertBefore(errorDiv, inputContainer.nextSibling);
  
  // Email validation function
  function isValidEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  }
  
  // Update button visibility and validation
  function updateEmailUI() {
    const email = emailInput.value.trim();
    console.log('Email value:', email); // Debug log
    
    if (email === '') {
      submitButton.style.display = 'none';
      errorDiv.style.display = 'none';
    } else {
      submitButton.style.display = 'block';
      console.log('Submit button should be visible'); // Debug log
      
      if (isValidEmail(email)) {
        submitButton.style.color = '#38b000';
        errorDiv.style.display = 'none';
        console.log('Email is valid - button green'); // Debug log
      } else {
        submitButton.style.color = '#ff6b6b';
        errorDiv.textContent = 'Please enter a valid email address';
        errorDiv.style.display = 'block';
        console.log('Email is invalid - button red'); // Debug log
      }
    }
  }
  
  // Submit handler
  function handleSubmit() {
    const email = emailInput.value.trim();
    
    if (isValidEmail(email)) {
      // Here you would normally send the email to your server
      errorDiv.style.color = '#38b000';
      errorDiv.textContent = 'Thank you for registering!';
      errorDiv.style.display = 'block';
      
      // Reset after 3 seconds
      setTimeout(() => {
        emailInput.value = '';
        errorDiv.style.display = 'none';
        submitButton.style.display = 'none';
      }, 3000);
    } else {
      errorDiv.style.color = '#ff6b6b';
      errorDiv.textContent = 'Please enter a valid email address';
      errorDiv.style.display = 'block';
    }
  }
  
  // Event listeners
  emailInput.addEventListener('input', updateEmailUI);
  submitButton.addEventListener('click', handleSubmit);
  
  // Also handle Enter key
  emailInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  });
});