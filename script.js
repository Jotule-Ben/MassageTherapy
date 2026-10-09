const modal = document.getElementById("bookingModal");
const selectedServiceText = document.getElementById("selectedServiceText");
const depositSummary = document.getElementById("depositSummary");
const bookingForm = document.getElementById("bookingForm");
const feedback = document.getElementById("formFeedback");
const serviceButtons = document.querySelectorAll(".service-button");
const closeTargets = document.querySelectorAll("[data-close-modal]");
const scrollButtons = document.querySelectorAll("[data-scroll-target]");
 
let activeService = {
name: "",
duration: "",
price: "",
deposit: ""
};
 
function openModal(service) {
activeService = service;
selectedServiceText.textContent = `${service.name} • ${service.duration} • ${service.price}`;
depositSummary.textContent = `${service.deposit}. A booking coordinator will confirm payment details and your final appointment window after review.`;
feedback.textContent = "";
modal.classList.add("is-open");
modal.setAttribute("aria-hidden", "false");
document.body.classList.add("modal-open");
}
 
function closeModal() {
modal.classList.remove("is-open");
modal.setAttribute("aria-hidden", "true");
document.body.classList.remove("modal-open");
}
 
function getServiceDetails(card) {
return {
name: card.dataset.service,
duration: card.dataset.duration,
price: card.dataset.price,
deposit: card.dataset.deposit
};
}
 
serviceButtons.forEach((button) => {
button.addEventListener("click", () => {
const card = button.closest(".service-card");
 
if (!card) {
return;
}
 
openModal(getServiceDetails(card));
});
});
 
closeTargets.forEach((target) => {
target.addEventListener("click", closeModal);
});
 
document.addEventListener("keydown", (event) => {
if (event.key === "Escape" && modal.classList.contains("is-open")) {
closeModal();
}
});
 
scrollButtons.forEach((button) => {
button.addEventListener("click", () => {
const targetSelector = button.getAttribute("data-scroll-target");
const target = document.querySelector(targetSelector);
 
if (target) {
target.scrollIntoView({ behavior: "smooth", block: "start" });
}
});
});
 
bookingForm.addEventListener("submit", (event) => {
event.preventDefault();
 
const formData = new FormData(bookingForm);
const fullName = formData.get("fullName");
const date = formData.get("date");
const time = formData.get("time");
 
feedback.textContent = `Thanks ${fullName}. Your request for ${activeService.name} on ${date} at ${time} has been captured. We will contact you shortly with deposit payment instructions.`;
bookingForm.reset();
 
window.setTimeout(() => {
closeModal();
}, 1800);
});