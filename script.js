$(document).ready(function () {

    // --- VISUAL EFFECTS (Matches Portfolio) ---
    // Custom Cursor
    const cursor = document.querySelector('.cursor-glow');
    if (cursor) {
        document.addEventListener('mousemove', (e) => {
            cursor.style.left = e.clientX + 'px';
            cursor.style.top = e.clientY + 'px';
        });
    }

    // --- Navigation Logic ---
    $('.nav-links li').on('click', function () {
        $('.nav-links li').removeClass('active');
        $(this).addClass('active');

        $('.form-section').removeClass('active');
        const target = $(this).data('target');
        $('#' + target).addClass('active');

        $('.form-message').hide().removeClass('success error');
    });

    // --- Helper Function ---
    function showMessage(formId, message, type) {
        const msgBox = $(`#${formId} .form-message`);
        msgBox.text(message).removeClass('success error').addClass(type).fadeIn();
        setTimeout(() => msgBox.fadeOut(), 3000);
    }

    // ==========================================
    // FORM 1: Registration
    // ==========================================
    $('input').on('focus', function () {
        console.log(`Field focused: ${this.id}`);
    });

    $('#reg-password').on('keyup', function () {
        const val = $(this).val();
        let strength = "Weak";
        let color = "#ff5555"; // Red for dark mode

        if (val.length > 8 && /[A-Z]/.test(val) && /[0-9]/.test(val)) {
            strength = "Strong";
            color = "#00ff00"; // Green
        } else if (val.length > 5) {
            strength = "Medium";
            color = "#ffa500"; // Orange
        }

        $('#password-strength').text(`Strength: ${strength}`).css('color', color);
    });

    $('#registration-form').on('submit', function (e) {
        e.preventDefault();
        const pass = $('#reg-password').val();
        const confirm = $('#reg-confirm').val();

        if (pass !== confirm) {
            showMessage('registration-form', "Passwords do not match!", "error");
        } else {
            showMessage('registration-form', "Registration Successful!", "success");
            this.reset();
            $('#password-strength').text('');
        }
    });

    // ==========================================
    // FORM 2: Login
    // ==========================================
    $('#toggle-password').on('click', function () {
        const input = $('#login-password');
        const type = input.attr('type') === 'password' ? 'text' : 'password';
        input.attr('type', type);
        $(this).text(type === 'password' ? '👁️' : '🚫');
    });

    $('#login-form').on('submit', function (e) {
        e.preventDefault();
        // Mock Login
        showMessage('login-form', "Logging in...", "success");
    });

    // Handle "Forgot Password" link click
    $('#link-to-forgot').on('click', function (e) {
        e.preventDefault();
        // Trigger click on the sidebar nav item
        $('.nav-links li[data-target="forgot-password-section"]').trigger('click');
    });

    // ==========================================
    // FORM 3: Forgot Password
    // ==========================================
    $('#forgot-form').on('submit', function (e) {
        e.preventDefault();
        const email = $('#forgot-email').val();
        showMessage('forgot-form', `Recovery link sent to ${email}`, "success");
    });

    // ==========================================
    // FORM 4: Contact Us
    // ==========================================
    $('#contact-subject').on('change', function () {
        const val = $(this).val();
        const hint = $('#subject-hint');
        switch (val) {
            case 'general': hint.text("We typically reply within 24 hours."); break;
            case 'support': hint.text("Please include your Ticket ID if applicable."); break;
            case 'business': hint.text("Directing you to our Sales Team."); break;
            default: hint.text("Please select a subject");
        }
    });

    $('#contact-form').on('submit', function (e) {
        e.preventDefault();
        showMessage('contact-form', "Message Sent!", "success");
        this.reset();
    });

    // ==========================================
    // FORM 5: Purchasing
    // ==========================================
    $('#product-card').on('mousemove', function (e) {
        const width = $(this).width();
        const height = $(this).height();
        const moveX = (e.pageX - $(this).offset().left) - (width / 2);
        const moveY = (e.pageY - $(this).offset().top) - (height / 2);
        $(this).css('transform', `perspective(500px) rotateY(${moveX / 20}deg) rotateX(${-moveY / 20}deg)`);
    }).on('mouseleave', function () {
        $(this).css('transform', 'perspective(500px) rotateY(0deg) rotateX(0deg)');
    });

    $('#buy-quantity').on('change keyup', function () {
        const qty = parseInt($(this).val()) || 0;
        const price = 199.00;
        $('#total-display').text(`$${(price * qty).toFixed(2)}`);
    });

    $('#purchase-form').on('submit', function (e) {
        e.preventDefault();
        const address = $('#buy-address').val().trim();
        if (address.length < 10) {
            showMessage('purchase-form', "Please enter a valid shipping address (min 10 chars).", "error");
        } else {
            showMessage('purchase-form', "Order Placed Successfully!", "success");
        }
    });

    // --- DEEP LINKING LOGIC ---
    // Check if URL has a hash (e.g., #login)
    const hash = window.location.hash.replace('#', '');
    if (hash) {
        const targetLink = $(`.nav-links li[data-target="${hash}-section"]`);
        if (targetLink.length) {
            targetLink.trigger('click');
        }
    }

});
