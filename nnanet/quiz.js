// Version 2.1.0
var jsCommandWindow = getParentWindow();
var current = 0;
var score = 0;
var bonus = 0;
var bonusCount = 0;
var vScoreMax = 0;
var passed = false;
var passing_score = 80;
var correct = 0;
var mode = 0;
var passCourse = false;
var saveToSuspend = false;
var questionCnt = quiz.length;
var currLanguage = parentWindow.vLanguage;

<!-- Audio files to load for each question  -->
var audiotoload = "";
var audio0 = "audio/blank.mp3";
var audio1 = "audio/blank.mp3";
var audio2 = "audio/blank.mp3";
var audio3 = "audio/blank.mp3";
var audio4 = "audio/blank.mp3";

function getParentWindow() {
    var parentWindow = window.parent;
    var maxRecursions = 5;

    for (var i = 0; i <= maxRecursions; i++) {
        if (typeof parentWindow.jscommand !== "undefined") {
            return parentWindow;
        } else {
            parentWindow = parent.parentWindow;
        }
    }

    alert("parent not found");
}

function loadSavedAnswers() {
    // Load saved answers if they were saved to suspend
    if (saveToSuspend) {
        if (jsCommandWindow.vSuspendData !== "") {
            var suspendObj = JSON.parse(jsCommandWindow.vSuspendData);

            // Find quiz to pull answers from
            for (var i = 0; i < suspendObj.length; i++) {
                if (suspendObj[i].title === quizTitle) {
                    // For each question match the id in the quiz object
                    for (var j = 0; j < suspendObj[i].questions.length; j++) {
                        for (var k = 0; k < quiz.length; k++) {
                            if (suspendObj[i].questions[j].id === quiz[k].id) {
                                quiz[k].selected = suspendObj[i].questions[j].selected;
                            }
                        }
                    }
                }
            }
        }
    }
}

function getAnswerString() {
    var answerString = "";
    if (saveToSuspend) {
        var questions = [];
        for (var i = 0; i < quiz.length; i++) {
            var question = {
                id: quiz[i].id,
                selected: quiz[i].selected,
                correct: quiz[i].correct
            };
            questions.push(question);
        }

        // Check if any data is in suspend currently
        var suspendObj;
        var suspendQuiz = {
            title: quizTitle,
            questions: questions
        };

        if (jsCommandWindow.vSuspendData !== "") {
            suspendObj = JSON.parse(jsCommandWindow.vSuspendData);

            // Update quiz if already saved to suspend
            var quizFound = false;
            for (var j = 0; j < suspendObj.length; j++) {
                if (suspendObj[j].title === quizTitle) {
                    // For each answered question see if we are updating an answer
                    for (i = 0; i < questions.length; i++) {
                        var questionFound = false;

                        for (var k = 0; k < suspendObj[j].questions.length; k++) {
                            if (questions[i].id === suspendObj[j].questions[k].id) {
                                suspendObj[j].questions[k] = questions[i];
                                questionFound = true;
                            }
                        }

                        // If question not found then add it
                        if (!questionFound) {
                            suspendObj[j].questions.push(questions[i]);
                        }
                    }
                    quizFound = true;
                }
            }

            // Add quiz if not found
            if (!quizFound) {
                suspendObj.push(suspendQuiz);
            }
        }
        // Add new quiz to suspend
        else {
            suspendObj = [suspendQuiz];
        }

        // Store array of objects as JSON string
        answerString = JSON.stringify(suspendObj);
    }

    return answerString;
}

function getUnhiddenQuestionIndex(currentIndex) {
    var hiddenQuestions = 0;
    var index = currentIndex - 1;
    while (index >= 0) {
        if (quiz[index].hasOwnProperty("hidden") && quiz[index].hidden) {
            hiddenQuestions++;
        }

        index--;
    }

    return currentIndex - hiddenQuestions;
}

function getUnhiddenQuestionCount() {
    var unhiddenCount = 0;

    for (var i = 0; i < quiz.length; i++) {
        if (!quiz[i].hasOwnProperty("hidden") || (quiz[i].hasOwnProperty("hidden") && !quiz[i].hidden)) {
            unhiddenCount++;
        }
    }

    return unhiddenCount;
}

function showAllQuestions() {
    for (var i = 0; i < quiz.length; i++) {
        if (quiz[i].hasOwnProperty("hidden") || (quiz[i].hasOwnProperty("hidden") && quiz[i].hidden)) {
            quiz[i].hidden = false;
        }
    }
}

function loadQuestion() {
    var q = quiz[current];

    // If this question is hidden go to next unhidden question
    var hidden = true;
    var offsetCurrent = 0;
    while (hidden && current < quiz.length) {
        if (q.hasOwnProperty("hidden") && q.hidden) {
            current++;
            q = quiz[current];
            offsetCurrent++;
        } else {
            hidden = false;
        }
    }

    // If all question are hidden. Skip to show results
    if (hidden) {
        current = quiz.length - 1;
        checkBonus();
        checkAnswers();
        loadSummary();
        return;
    }

    var choices = q.choices;
    var str = '';
    if (current == (questionCnt - 1)) {
        if (currLanguage == "Spanish") {
            $("#next").removeClass("next").addClass("nextresults").html("Ver resultados");
        } else {
            $("#next").removeClass("next").addClass("nextresults").html("Show Results");
        }
    } else {
        if ($("#next").hasClass("nextresults")) {
            if (currLanguage == "Spanish") {
                $("#next").removeClass("nextresults").addClass("next").html("Próxima pregunta");
            } else {
                $("#next").removeClass("nextresults").addClass("next").html("Next Question");
            }
        }
    }
    $("#header").empty();
    $("#question").empty();
    $("#radios").empty();
    if (currLanguage == "Spanish") {
        $("#header").html("PREGUNTA " + (getUnhiddenQuestionIndex(current) + 1) + " DE " + getUnhiddenQuestionCount());
    } else {
        $("#header").html("QUESTION " + (getUnhiddenQuestionIndex(current) + 1) + " OF " + getUnhiddenQuestionCount());
    }
    $("#question").html(q.question);

    // Only display an image if one is assigned
    if (q.image != "") {
        $("#quiz_image").html("<img src='" + q.image + "' />");
        document.getElementById("quiz").style.padding = "55px 0px 0px 60px";
        document.getElementById("question").style.width = "440px";
        document.getElementById("radios").style.width = "450px";

    } else {
        $("#quiz_image").html("<img src='images/blank.gif' />");
        document.getElementById("quiz").style.padding = "55px 0px 0px 200px";
        document.getElementById("question").style.width = "650px";
        document.getElementById("radios").style.width = "650px";
    }

    // Rater
    if (q.hasOwnProperty("type") && q.type == "rater") {
        var radios = $('#radios');
        // Write hidden select for rater to latch onto
        var rater = $('<select></select>').attr('id', 'rater');
        for (i = 1; i <= q.choices; i++) {
            rater.append(
                $('<option/>')
                .attr('type', 'text')
                .attr('value', i)
                .html(i)
            );
        }
        radios.append(rater);

        // Setup rater
        rater.barrating('show', {
            theme: 'bars-square',
            showValues: true,
            showSelectedRating: false,
            onSelect: function (value) {
                q.selected = value;
            }
        });

        // Add clearfix for height
        radios.find('.br-wrapper').append($("<div></div>").addClass("clear"));

        // Select previous answer if set
        if (q.selected !== -1) {
            rater.barrating('set', q.selected);
        }

        // Output legend
        var legend = $("<div></div>").addClass("legend").append(
            $("<div></div>").addClass("column alpha").html("No satisfecho"),
            $("<div></div>").addClass("column mu").html("Satisfecho"),
            $("<div></div>").addClass("column omega").html("Muy satisfecho"),
            $("<div></div>").addClass("clear")
        );
        radios.append(legend);

    }
    // TextArea
    else if (q.hasOwnProperty("type") && q.type == "textarea") {
        var textArea = $('<textarea></textarea>');

        $('#radios').append(textArea);

        // Update listener
        textArea.change(function () {
            q.selected = $(this).val();
            console.log(q.selected);
        });

        // Fill previous answer if set
        if (q.selected !== -1) {
            textArea.val(q.selected);
        }
    }
    // Checkboxes
    else {
        var inputType = Array.isArray(q.correct) ? 'checkbox' : 'radio';
        var multiSelectClass = Array.isArray(q.correct) ? 'multi' : '';
        for (var i = 0; i < choices.length; i++) {
            str += "<div class=feedback id='feedback-" + (i + 1) + "'><label class='label_radio " + multiSelectClass + "' for='radio-" + (i + 1) + "'><input name='sample-radio' id='radio-" + (i + 1) + "' value='1' type='" + inputType + "' />" + choices[i] + "</label></div>";
        }
        $("#radios").html(str);
        if (mode == 0) {
            $('.label_radio').click(function (evt) {
                // Default checkbox behavior causes double event firing
                evt.stopPropagation();
                evt.preventDefault();

                // Only check click if input is not disabled. Side effect of above code
                var disabled = $(this).find('input').first().prop('disabled');
                if (!disabled) {
                    setupLabel(this);
                }
            });
            setupLabel2();
        } else if (mode == 1) {
            setupLabel2();
            btn_check();
        }
    }

    // Hide check answer for non-scored questions
    if ((q.hasOwnProperty("type") && (q.type == "rater" || q.type == "textarea")) || mode === 1) {
        $("#check").hide();
    } else {
        $("#check").show();
    }

    // Show previous button if the last question was non-scored
    if (current > 0 && quiz[current - 1].hasOwnProperty("type") && (quiz[current - 1].type !== "checkbox")) {
        $("#prev").show();
    } else {
        $("#prev").hide();
    }

    //audiotoload = eval("audio"+current);
    //jwplayer().load([{file:audiotoload}]);
    //jwplayer().play(true);
}

function loadSummaryDetail() {
    var q = quiz[current];
    var choices = q.choices;
    var str = '';
    $("#summary-note").empty();
    $("#summary-steps").empty();
    $("#score").empty().html(score + "%");
    $("#bonus").empty().html(bonus);
    $("#total").empty().html(parseInt(score));
    if (getScoredQuestionCount() === 0) {
        if (currLanguage == "Spanish") {
            $("#summary-note").html("<span class=summary-note-pass>¡Muchas gracias!</span>");
            $("#summary-steps").html("Apreciamos mucho tus comentarios, y los evaluaremos detenidamente para poder identificar posibles áreas de oportunidad y hacer tus futuras sesiones de capacitación más interesantes, completas, y eficientes.");
        } else {
            $("#summary-note").html("<span class=summary-note-pass>Thank you!</span>");
            $("#summary-steps").html("We greatly appreciate your comments, and we will evaluate them carefully in order to identify possible areas of opportunity and make your future training sessions more interesting, complete, and efficient.");
        }
        $("#review").show();
        parent.playMedia(0, 0, 0, 0, "content/audio/blank.mp3", "content/images/content_back.jpg", true, false);

    } else if (score >= passing_score) {
        if (currLanguage == "Spanish") {
            if (quizTitle == "Quiz") {
                $("#summary-note").html("<span class=summary-note-pass>FELICIDADES</span><br/>por tu puntaje de aprobación.");
                $("#summary-steps").html("<p>Aquí está su puntaje para este módulo.<br></br>Seleccione Siguiente para continuar.</p>");
            } else {
                $("#summary-note").html("<span class=summary-note-pass>FELICIDADES</span><br/>por tu puntaje de aprobación.");
                $("#summary-steps").html("<p>Aquí está tu puntaje para el curso.<br></br>Seleccione Siguiente para continuar.</p>");
            }
        } else {
            if (quizTitle == "Quiz") {
                $("#summary-note").html("<span class=summary-note-pass>CONGRATULATIONS</span><br/>on your passing score.");
                $("#summary-steps").html("<p>Here is your score for this module.<br></br>Select Next to continue.</p>");
            } else {
                $("#summary-note").html("<span class=summary-note-pass>CONGRATULATIONS</span><br/>on your passing score.");
                $("#summary-steps").html("<p>Here is your score for the course.<br></br>Select Next to continue.</p>");
            }
        }
        $("#review").show();
        $("#but1").addClass("correctUp");

        parent.playMedia(0, 0, 0, 0, "content/audio/blank.mp3", "content/images/content_back.jpg", true, false);
    } else {
        if (currLanguage == "Spanish") {
            if (quizTitle == "Quiz") {
                $("#summary-note").html(passing_score + "% requerido para pasar la verificación de conocimiento.");
                $("#summary-steps").html("No recibió un puntaje de aprobación. Revise las preguntas que perdió, revise el material y responda las preguntas correctamente para recibir crédito por el módulo. <br/> <br/> Puede hacer clic en el botón REVISAR para obtener un resumen de sus resultados, o hacer clic en el botón REINICIAR para tome la Verificación de conocimiento nuevamente.");
            } else {
                $("#summary-note").html(passing_score + "% requerido para pasar la prueba posterior.");
                $("#summary-steps").html("No recibió un puntaje de aprobación. Revise las preguntas que perdió, revise el material y responda las preguntas correctamente para recibir crédito por el curso.<br/><br/>Puede hacer clic en el botón REVISAR para obtener un resumen de sus resultados, o hacer clic en el botón REINTENTAR para tome la prueba posterior nuevamente.");
            }
        } else {
            if (quizTitle == "Quiz") {
                $("#summary-note").html(passing_score + "% required to pass the Knowledge Check.");
                $("#summary-steps").html("You did not receive a passing score. Please review the questions you missed, review the material, and answer the questions correctly to receive credit for the module.<br/><br/>You can click the REVIEW button for a recap of your results, or click the RETRY button to take the Knowledge Check again.");
            } else {
                $("#summary-note").html(passing_score + "% required to pass the Post Test.");
                $("#summary-steps").html("You did not receive a passing score. Please review the questions you missed, review the material, and answer the questions correctly to receive credit for the course.<br/><br/>You can click the REVIEW button for a recap of your results, or click the RETRY button to take the Post Test again.");
            }
        }
        $("#review").show();
        $("#retry").show();
        $("#but1").removeClass("correctUp");
        parent.playMedia(0, 0, 0, 0,
            "content/audio/blank.mp3", "content/images/content_back.jpg", true, false);
    }
}

function updateVAMiles() {
    // update VA Miles
    vScoreMax = Math.round(Number(score) / 10);
    //save VAMiles to score max in SCO record
    jsCommandWindow.jscommand("LMSSaveScoreMax", vScoreMax);
    jsCommandWindow.jscommand("LMSCommit");
}

function loadQuiz() {
    current = 0;

    // Check if the course has been passed
    if (jsCommandWindow.vStatus === "passed") {
        loadSavedAnswers();
        showAllQuestions();
        loadReview(true);
    } else {
        $('#summary').hide();
        $("#review").hide();
        $("#retry").hide();
        $("#prev").hide();
        $("#check").show();
        $("#next").show();
        $('#quiz').show();
        loadSavedAnswers();
        loadQuestion();
    }
}

function loadSummary() {
    $('#quiz').hide();
    $("#check").hide();
    $("#prev").hide();
    $("#next").hide();
    loadSummaryDetail();
    $('#summary').show();
}

function loadReview(passed) {
    current = 0;
    if (!passed) {
        mode = 1;
        $("#check").hide();
    } else {
        $("#check").show();
    }

    showAllQuestions();
    $('#summary').hide();
    $("#review").hide();
    $("#retry").hide();
    loadQuestion();
    $("#next").show();
    $('#quiz').show();
}

function addEventHandler(elem, eventType, handler) {
    if (elem.addEventListener)
        elem.addEventListener(eventType, handler, false);
    else if (elem.attachEvent)
        elem.attachEvent('on' + eventType, handler);
}

function setupLabel(elem) {
    var q = quiz[current];
    if ($('.label_radio input').length) {

        // Toggle input state
        var input = $(elem).find('input').first();
        input.prop('checked', !input.prop('checked'));

        if (!Array.isArray(q.correct)) {
            $('.label_radio').each(function () {
                $(this).removeClass('r_on');
                q.selected = -1;
            });
        } else {
            // Remove item from selected array
            var active = $(elem).hasClass('r_on');
            if (active) {
                $(elem).removeClass('r_on');
                if (input.length && Array.isArray(q.selected)) {
                    var answer = parseInt(input.attr('id').split('-')[1]);
                    var index = q.selected.indexOf(answer);

                    // Remove this answer from array if present
                    if (index > -1) {
                        q.selected.splice(index, 1);
                    }
                }
            }
        }

        // Clear previous selections on a multiple select
        if (Array.isArray(q.correct)) {
            q.selected = [];
        }

        $('.label_radio input:checked').each(function () {
            $(this).parent('label').addClass('r_on');
            var str = $(this).attr('id');
            var answer = parseInt(str.split('-')[1]);

            if (!Array.isArray(q.correct)) {
                q.selected = parseInt(answer);
            } else {
                // Add answer to array
                q.selected.push(answer);
            }
        });

    }
}

function setupLabel2() {
    var q = quiz[current];
    var choices = q.choices;
    if ($('.label_radio input').length) {
        $('.label_radio').each(function () {
            $(this).removeClass('r_on');
        });
        if (q.selected != -1) {
            if (!Array.isArray(q.correct)) {
                $('#radio-' + q.selected).each(function () {
                    $(this).attr('checked', 'checked');
                    $(this).parent('label').addClass('r_on');
                });
            } else {
                for (var i = 0; i < q.selected.length; i++) {
                    $('#radio-' + q.selected[i]).each(function () {
                        $(this).attr('checked', 'checked');
                        $(this).parent('label').addClass('r_on');
                    });
                }
            }

        }
    }
}

function btn_check() {
    var q = quiz[current];
    var isCorrect;
    if (checkAnswered()) {
        if ((!Array.isArray(q.correct) && q.correct == q.selected)) {
            $('#feedback-' + q.correct).removeClass("feedback");
            $('#feedback-' + q.correct).addClass("correct");
            isCorrect = true;
        } else if (Array.isArray(q.correct)) {
            isCorrect = checkMultipleAnswer(q.correct, q.selected, true);
        } else {
            $('#feedback-' + q.correct).removeClass("feedback");
            $('#feedback-' + q.selected).removeClass("feedback");
            $('#feedback-' + q.selected).addClass("incorrect");
            $('#feedback-' + q.correct).addClass("correct");
            isCorrect = false;
        }
        $('.label_radio input').each(function () {
            $(this).attr('disabled', 'disabled');
        });
        displayExplanation(isCorrect);
    }
}

// Check if this question is required and unanswered
function checkAnswered() {
    var q = quiz[current];
    $("#status").hide();
    if (q.required && q.selected == -1) {
        var noSelect = $("#noselect");
        var incompleteMsg = "";
        switch (q.type) {
            case "textarea":
                if (currLanguage == "Spanish") {
                    incompleteMsg = "Por favor ingrese el texto en la casilla.";
                } else {
                    incompleteMsg = "Please enter text into the box.";
                }
                break;
            case "rater":
                if (currLanguage == "Spanish") {
                    incompleteMsg = "Por favor escoja un número.";
                } else {
                    incompleteMsg = "Please choose a number.";
                }
                break;
            default:
                if (currLanguage == "Spanish") {
                    incompleteMsg = "Por favor seleccione por lo menos una casilla de muesca.";
                } else {
                    incompleteMsg = "Please select at least one checkbox.";
                }
                break;
        }

        noSelect.find("p").html(incompleteMsg);
        noSelect.dialog({
            height: 140,
            modal: true
        });
        return false;
    }

    return true;
}

// Returns the number of questions that are actually scored
function getScoredQuestionCount() {
    var scored = 0;
    for (var i = 0; i < quiz.length; i++) {
        if (quiz[i].correct != null) {
            scored++;
        }
    }

    return scored;
}

// Check if all correct answers are selected
function checkMultipleAnswer(correct, selected, updateDisplay) {
    var isCorrect = true;
    var incorrectSelections = selected.slice(0);

    for (var i = 0; i < correct.length; i++) {
        // If any correct answer is missing from the selected set mark answer false
        if (selected.indexOf(correct[i]) == -1) {
            isCorrect = false;
        }
        // Mark selection as correct
        else {
            if (updateDisplay) {
                $('#feedback-' + correct[i]).removeClass("feedback").addClass("correct");
            }

            // Remove correct answers from incorrect selections array
            var index = incorrectSelections.indexOf(correct[i]);
            if (index > -1) {
                incorrectSelections.splice(index, 1);
            }
        }
    }

    // If there are any incorrect answers left over, the whole answer is incorrect
    if (incorrectSelections.length > 0) {
        isCorrect = false;
    }

    if (updateDisplay) {
        // Display incorrect selections
        for (i = 0; i < incorrectSelections.length; i++) {
            $('#feedback-' + incorrectSelections[i]).removeClass("feedback").addClass("incorrect");
        }

        // Display remaining correct selections
        for (i = 0; i < correct.length; i++) {
            var feedback = $('#feedback-' + correct[i]);
            if (feedback.hasClass("feedback")) {
                feedback.removeClass("feedback").addClass("correct");
            }
        }
    }

    return isCorrect;
}

function displayExplanation(isCorrect) {
    // $("#check").hide();
    var q = quiz[current];
    var str = '';

    if (currLanguage == "Spanish") {
        if (isCorrect) str += 'Correcto. ';
        else str += 'Incorrecto. ';
    } else {
        if (isCorrect) str += 'Correct. ';
        else str += 'Incorrect. ';
    }

    str += q.explanation;
    $("#status").html(str);
    $("#status").show();
}

function checkAnswers() {
    correct = 0;
    for (var i = 0; i < questionCnt; i++) {
        var q = quiz[i];
        if (!Array.isArray(q.correct)) {
            if (q.correct == q.selected) {
                
            }
            correct++;
        } else {
            if (checkMultipleAnswer(q.correct, q.selected, false)) {
                
            }
            correct++;
        }
    }

    // Hide score for an non-scored exam
    if (getScoredQuestionCount() > 0) {
        score = ((correct + bonus) / (getScoredQuestionCount() + bonusCount) * 100).toFixed(0);
    } else {
        score = 100;
        $("#score").hide();
        $("#score-header").hide();
    }

    // Save score to database regardless of pass status
    jsCommandWindow.jscommand("LMSSaveScore", parseInt(score));

    // Save answers to suspend if set
    if (saveToSuspend) {
        jsCommandWindow.vSuspendData = getAnswerString();
        jsCommandWindow.jscommand("LMSSaveModStatus", jsCommandWindow.vSuspendData);
    }

    jsCommandWindow.jscommand("LMSCommit");

    if (score >= passing_score) {
        $("#total").removeClass("fail");
        $("#score").removeClass("fail");
        //Save VA Miles to database
        updateVAMiles();
        pass();
    } else {
        $("#total").addClass("fail");
        $("#score").addClass("fail");
    }
}

function checkBonus() {
    // Bonus questions
    var bonusCorrect = 0;
    bonusCount = 0;
    if (saveToSuspend) {
        if (jsCommandWindow.vSuspendData !== "") {
            var suspendObj = JSON.parse(jsCommandWindow.vSuspendData);

            // Add up all correct answers for quizes that don' match this title
            for (i = 0; i < suspendObj.length; i++) {
                if (suspendObj[i].title != quizTitle && suspendObj[i].title.indexOf('Catchup') == -1) {
                    for (var j = 0; j < suspendObj[i].answers.length; j++) {
                        // Check if answer is an array and either compare arrays or just values
                        if (Array.isArray(suspendObj[i].key[j])) {
                            if (arraysEqual(suspendObj[i].answers[j], suspendObj[i].key[j])) {
                                bonusCorrect++;
                            }
                        } else {
                            if (suspendObj[i].answers[j] == suspendObj[i].key[j]) {
                                bonusCorrect++;
                            }
                        }

                        // Track number of bonus questions
                        bonusCount++;
                    }
                }
            }

            bonus = bonusCorrect;
        }
    }
}

function arraysEqual(arr1, arr2) {
    if (arr1.length !== arr2.length)
        return false;
    for (var i = arr1.length; i--;) {
        if (arr1[i] !== arr2[i])
            return false;
    }

    return true;
}

// This course has conditional logic on passing. Only when they have a perfect score on previous modules does passed get set to true
function pass() {
    if (!passed) {
        if (passCourse) {
            jsCommandWindow.fPassCourse();
            passed = true;
        }
        jsCommandWindow.fEnableNext();
    }
}

function btn_next() {
    if (checkAnswered()) {
        if (current < (questionCnt - 1)) {
            current++;
            if (mode == 1 && current > 0) {
                $("#prev").show();
            }
            loadQuestion();
        } else {
            checkBonus();
            checkAnswers();
            loadSummary();
        }
    }
}

function btn_retry() {
    // Clear the suspend on retry so previous answers are not still selected
    if (saveToSuspend) {
        //jsCommandWindow.vSuspendData = "";
    }

    $('#summary').hide();
    $("#review").hide();
    $("#retry").hide();
    $("#prev").hide();
    $("#check").show();
    $("#next").show();
    $('#quiz').show();

    current = 0;
    mode = 0;
    showAllQuestions();
    loadQuestion();
}

function btn_review() {
    loadReview(false);
}

function btn_prev() {
    if (current > 0) {
        current--;
        if (mode == 1 && current == 0) {
            $("#prev").hide();
        }
        loadQuestion();
    }
}

$("#but1").click(function () {
    /*parentWindow.inPopup=true;*/
    window.open("../content/pdf/Intelligent Mobility Pocket Guide.pdf");
});

$(function () {
    $('body').addClass('has-js');
    addEventHandler($("#check")[0], "click", btn_check);
    addEventHandler($("#next")[0], "click", btn_next);
    addEventHandler($("#prev")[0], "click", btn_prev);
    addEventHandler($("#review")[0], "click", btn_review);
    addEventHandler($("#retry")[0], "click", btn_retry);
    //loadQuiz();
});
