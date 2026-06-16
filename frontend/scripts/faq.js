// FAQ Accordion
document.addEventListener('DOMContentLoaded', () => {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');
        const toggle = item.querySelector('.faq-toggle');
        
        if (question && answer) {
            // Remove any existing listeners to avoid duplicates
            const newQuestion = question.cloneNode(true);
            question.parentNode.replaceChild(newQuestion, question);
            
            newQuestion.addEventListener('click', () => {
                // Close other items
                faqItems.forEach(otherItem => {
                    if (otherItem !== item) {
                        const otherAnswer = otherItem.querySelector('.faq-answer');
                        const otherToggle = otherItem.querySelector('.faq-toggle');
                        if (otherAnswer) otherAnswer.classList.remove('active');
                        if (otherToggle) otherToggle.textContent = '+';
                    }
                });
                
                // Toggle current
                const currentAnswer = item.querySelector('.faq-answer');
                const currentToggle = item.querySelector('.faq-toggle');
                if (currentAnswer) {
                    currentAnswer.classList.toggle('active');
                }
                if (currentToggle) {
                    currentToggle.textContent = currentAnswer.classList.contains('active') ? '−' : '+';
                }
            });
        }
    });
});