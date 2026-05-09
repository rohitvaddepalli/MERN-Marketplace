import React, { useState } from 'react';
import './Help.css';

const Help = () => {
    const [activeCategory, setActiveCategory] = useState('general');
    const [openFaq, setOpenFaq] = useState(null);

    const categories = [
        { id: 'general', name: 'General', icon: '❓' },
        { id: 'orders', name: 'Orders', icon: '📦' },
        { id: 'payments', name: 'Payments', icon: '💳' },
        { id: 'sellers', name: 'For Sellers', icon: '🏪' },
        { id: 'account', name: 'Account', icon: '👤' }
    ];

    const faqs = {
        general: [
            {
                question: 'What is Marketplace?',
                answer: 'Marketplace is an online platform that connects local sellers with customers worldwide. We provide a secure and user-friendly environment for buying and selling quality products.'
            },
            {
                question: 'How do I create an account?',
                answer: 'Click on the "Sign Up" button in the top right corner, fill in your details, and verify your email address. You can then start shopping or selling immediately.'
            },
            {
                question: 'Is it free to use Marketplace?',
                answer: 'Creating an account and browsing products is completely free. Sellers pay a small commission on each sale to help us maintain and improve the platform.'
            }
        ],
        orders: [
            {
                question: 'How do I track my order?',
                answer: 'Go to "My Orders" in your account dashboard. Click on any order to view detailed tracking information and estimated delivery dates.'
            },
            {
                question: 'Can I cancel my order?',
                answer: 'Yes, you can cancel orders before they are shipped. Go to your order details and click "Cancel Order". Refunds will be processed within 5-7 business days.'
            },
            {
                question: 'What is your return policy?',
                answer: 'We offer a 30-day return policy on most items. Products must be unused and in original packaging. Contact the seller or our support team to initiate a return.'
            }
        ],
        payments: [
            {
                question: 'What payment methods do you accept?',
                answer: 'We accept all major credit cards, debit cards, PayPal, and various digital wallets. All transactions are secured with industry-standard encryption.'
            },
            {
                question: 'Is my payment information secure?',
                answer: 'Absolutely! We use SSL encryption and comply with PCI DSS standards to ensure your payment information is always protected.'
            },
            {
                question: 'When will I be charged?',
                answer: 'Your payment method is charged immediately when you place an order. If an order is cancelled, refunds are processed within 5-7 business days.'
            }
        ],
        sellers: [
            {
                question: 'How do I become a seller?',
                answer: 'Click "Become a Seller" and complete the registration process. You\'ll need to provide business information and verify your identity. Once approved, you can start listing products.'
            },
            {
                question: 'What are the seller fees?',
                answer: 'We charge a small commission on each sale (typically 5-10% depending on category). There are no monthly fees or listing fees.'
            },
            {
                question: 'How do I get paid?',
                answer: 'Payments are transferred to your registered bank account or PayPal after the order is delivered and the return period has passed (typically 7-14 days).'
            }
        ],
        account: [
            {
                question: 'How do I reset my password?',
                answer: 'Click "Forgot Password" on the login page. Enter your email address and we\'ll send you a password reset link.'
            },
            {
                question: 'Can I change my email address?',
                answer: 'Yes, go to Account Settings > Profile and update your email address. You\'ll need to verify the new email before it becomes active.'
            },
            {
                question: 'How do I delete my account?',
                answer: 'Contact our support team to request account deletion. Please note that this action is permanent and cannot be undone.'
            }
        ]
    };

    const toggleFaq = (index) => {
        setOpenFaq(openFaq === index ? null : index);
    };

    return (
        <div className="help-page">
            <section className="help-hero">
                <div className="container">
                    <h1>Help Center</h1>
                    <p>Find answers to your questions and get the support you need</p>
                    <div className="help-search">
                        <label htmlFor="help-search-input" className="sr-only" style={{ display: 'none' }}>Search for help</label>
                        <input id="help-search-input" type="text" placeholder="Search for help..." />
                        <button className="btn btn-primary">Search</button>
                    </div>
                </div>
            </section>

            <section className="help-content">
                <div className="container">
                    <div className="help-categories">
                        {categories.map(category => (
                            <button
                                key={category.id}
                                className={`category-btn ${activeCategory === category.id ? 'active' : ''}`}
                                onClick={() => setActiveCategory(category.id)}
                            >
                                <span className="category-icon">{category.icon}</span>
                                {category.name}
                            </button>
                        ))}
                    </div>

                    <div className="faq-section">
                        <h2>{categories.find(c => c.id === activeCategory)?.name} Questions</h2>
                        <div className="faq-list">
                            {faqs[activeCategory].map((faq, index) => {
                                const isOpen = openFaq === index;
                                const contentId = `faq-content-${activeCategory}-${index}`;
                                return (
                                <div key={index} className={`faq-item ${isOpen ? 'open' : ''}`}>
                                    <button 
                                        className="faq-question" 
                                        onClick={() => toggleFaq(index)}
                                        aria-expanded={isOpen}
                                        aria-controls={contentId}
                                    >
                                        <span>{faq.question}</span>
                                        <svg
                                            width="20"
                                            height="20"
                                            viewBox="0 0 20 20"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            className="faq-icon"
                                        >
                                            <polyline points="6 9 12 15 18 9" />
                                        </svg>
                                    </button>
                                    <div 
                                        id={contentId}
                                        className="faq-answer"
                                        role="region"
                                        aria-hidden={!isOpen}
                                    >
                                        <p>{faq.answer}</p>
                                    </div>
                                </div>
                            )})}
                        </div>
                    </div>

                    <div className="help-contact">
                        <h2>Still need help?</h2>
                        <p>Our support team is here to assist you</p>
                        <div className="contact-options">
                            <a href="/contact" className="contact-option">
                                <div className="contact-option-icon">📧</div>
                                <h3>Email Support</h3>
                                <p>support@marketplace.com</p>
                            </a>
                            <div className="contact-option">
                                <div className="contact-option-icon">💬</div>
                                <h3>Live Chat</h3>
                                <p>Available 9 AM - 6 PM</p>
                            </div>
                            <div className="contact-option">
                                <div className="contact-option-icon">📞</div>
                                <h3>Phone Support</h3>
                                <p>+1 (555) 123-4567</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Help;
