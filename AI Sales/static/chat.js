var questionType = ''
  /////---init -----///
  fetch("question")
  .then(response => response.json())
  .then(data => {
    console.log(data);
    get("#bot-text").innerHTML = data.data
    questionType = data.type
    // do something with the data
  })
  .catch(error => console.error(error));


  //////////-----///////////
    const msgerForm = get(".msger-inputarea");
    const msgerInput = get(".msger-input");
    const msgerChat = get(".msger-chat");
    const myInput = get('#textInput');

    // Icons made by Freepik from www.flaticon.com
    const BOT_IMG = "https://image.flaticon.com/icons/svg/327/327779.svg";
    const PERSON_IMG = "https://image.flaticon.com/icons/svg/145/145867.svg";
    const BOT_NAME = "Teddy";
    const PERSON_NAME = "You";



    function myFunction() {
      console.log("Hello!");
    }
    var checkCalculate = setInterval(myFunction, 2000);


    myInput.addEventListener('focus', function() {
      console.log('Input field has been focused');
      clearInterval(checkCalculate)
      // Add your code here to perform some action when the input field is focused
    });
    myInput.addEventListener('blur', function() {
      checkCalculate = setInterval(myFunction, 2000);
      // Add your code here to perform some action when the input field is focused
    });
    msgerForm.addEventListener("submit", event => {
      event.preventDefault();

      const msgText = msgerInput.value;
      if (!msgText) return;
      appendMessage(PERSON_NAME, PERSON_IMG, "right", msgText);
      appendSpinner();

      msgerInput.value = "";
      botResponse(msgText, questionType);
      console.log('question')
      questionType = ''
    });

    function appendSpinner() {
      //   Simple solution for small apps

      const msgHTML = `
        <div class="msg left-msg-spinner">
          <div class="spinner-grow" style="width: 1rem; height: 1rem;" role="status">
            <span class="sr-only">Loading...</span>
          </div>
        </div>
        `;

      msgerChat.insertAdjacentHTML("beforeend", msgHTML);
      msgerChat.scrollTop += 500;
    }

    function appendMessage(name, img, side, text) {
      //   Simple solution for small apps

      const msgHTML = `
<div class="msg ${side}-msg">
<!--  <div class="msg-img"></div>-->

  <div class="msg-bubble">
  <i class="fa-solid fa-comment"></i>
    <div class="msg-info">
      <div class="msg-info-name">${name}</div>
      <div class="msg-info-time">${formatDate(new Date())}</div>
    </div>

    <div class="msg-text">${text}</div>
  </div>
</div>
`;

      msgerChat.insertAdjacentHTML("beforeend", msgHTML);
      msgerChat.scrollTop += 500;
    }
    function botResponse(rawText, type) {

      // Bot Response
      $.get("/get", { msg: rawText, questionType: type }).done(function (data) {
        console.log(rawText);
        get(".left-msg-spinner").remove()
        var msgText = ''
        if(data == "BOOOB")
        {
          fetch("question")
          .then(response => response.json())
          .then(data => {
            console.log(data);
            msgText = data.data;
            questionType = data.type
            appendMessage(BOT_NAME, BOT_IMG, "left", msgText);

            // do something with the data
          })
          .catch(error => console.error(error));
        } else {
          appendMessage(BOT_NAME, BOT_IMG, "left", data);
        }
        console.log(data);

      });

    }



    // Utils
    function get(selector, root = document) {
      return root.querySelector(selector);
    }

    function formatDate(date) {
      const h = "0" + date.getHours();
      const m = "0" + date.getMinutes();

      return `${h.slice(-2)}:${m.slice(-2)}`;
    }