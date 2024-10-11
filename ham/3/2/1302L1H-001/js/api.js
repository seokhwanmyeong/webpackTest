let initComplete = false;
let initData;
let resultOcrText;
let resultOcrTextList;
let resultSttText = null;
let resultSttScore = 0;
let resultSttCloseType = null;
let activeSttCheck = false;
let activeOcrCheck = false;
console.log("Dnsoft version.0.5.2 Date.2024.10.04");

// 퀴즈 입력 함수
function set_QUIZ_INPUT(id, type, input, answer, solveTime) {
  console.log(
    "setActivityData-QUIZ_INPUT Req",
    { id: id, type: type },
    {
      input: input,
      answer: answer,
      solveTime: solveTime,
    }
  );

  setActivityData(
    "QUIZ_INPUT",
    JSON.stringify({
      id: id,
      type: type,
    }),
    JSON.stringify({
      input: input,
      answer: answer,
      solveTime: solveTime,
    })
  );
}

function get_QUIZ_INPUT(id, type, callback) {
  console.log("getActivityData-QUIZ_INPUT Req", { id: id, type: type });

  getActivityData(
    "QUIZ_INPUT",
    JSON.stringify({ id: id, type: type }),
    callback
  );

  initComplete = true;
}

// 퀴즈 정답 설정 함수
function set_QUIZ_CORRECT(id, type, correct) {
  console.log(
    "setActivityData-QUIZ_CORRECT Req",
    { id: id, type: type },
    `correct: ${correct}`
  );

  setActivityData(
    "QUIZ_CORRECT",
    JSON.stringify({
      id: id,
      type: type,
    }),
    correct
  );
}

function get_QUIZ_CORRECT(id, type, callback) {
  console.log("getActivityData-QUIZ_CORRECT Req", { id: id, type: type });

  getActivityData(
    "QUIZ_CORRECT",
    JSON.stringify({ id: id, type: type }),
    callback
  );
}

// OCR 함수
function call_OCR_DIRECT(
  id,
  type = "english",
  dataBase64 = "이미지 데이터",
  callback
) {
  console.log("OCR-callContentsTool-OCR_DIRECT Req", {
    id: id,
    type: "english",
    dataBase64: dataBase64,
    callback: callback,
  });
  console.log(`OCR dataBase64: ${dataBase64}`);

  callContentsTool(
    "OCR_DIRECT",
    JSON.stringify({
      id: id,
      type: type,
      dataBase64: dataBase64,
      callback: callback,
    })
  );
}

// STT 함수
function call_STT(id, text, modelId, audioPath, imgPath, callback) {
  console.log("STT-callContentsTool-STT Req", {
    id: id,
    text: text,
    modelId: modelId,
    audioPath: audioPath,
    imgPath: imgPath,
    callback: callback,
  });

  callContentsTool(
    "STT",
    JSON.stringify({
      id: id,
      text: text,
      modelId: modelId,
      audioPath: audioPath,
      imgPath: imgPath,
      callback: callback,
    })
  );
}

function call_STT_W_TEST(id, text, modelId, audioPath, imgPath, callback) {
  console.log("STT-callContentsTool-STT_W_TEST Req", {
    id: id,
    text: text,
    modelId: modelId,
    audioPath: audioPath,
    imgPath: imgPath,
    callback: callback,
  });

  callContentsTool(
    "STT_W_TEST",
    JSON.stringify({
      id: id,
      text: text,
      modelId: modelId,
      audioPath: audioPath,
      imgPath: imgPath,
      callback: callback,
    })
  );
}

function call_STT_S_TEST(id, text, modelId, audioPath, imgPath, callback) {
  console.log("STT-callContentsTool-STT_S_TEST Req", {
    id: id,
    text: text,
    modelId: modelId,
    audioPath: audioPath,
    imgPath: imgPath,
    callback: callback,
  });

  callContentsTool(
    "STT_S_TEST",
    JSON.stringify({
      id: id,
      text: text,
      modelId: modelId,
      audioPath: audioPath,
      imgPath: imgPath,
      callback: callback,
    })
  );
}

// 콜백 함수 예시
function callBackQuizInput(response) {
  handleQuizInput(response);
}

function callBackQuizCorrect(response) {
  handleQuizCorrect(response);
}

function callBackOCR(response) {
  handleOCR(response);
}

function callBackSTT(response) {
  handleSTT(response);
}

// 핸들러 함수
function handleQuizInput(response) {
  console.log("callBack 퀴즈 입력 처리 response:", response);
  // 응답을 필요에 따라 처리
  if (response) {
    const data = JSON.parse(response);
    console.log("입력 데이터:", data.input);
    console.log("정답:", data.answer);
    console.log("소요 시간:", data.solveTime);
    initData = data;
  } else {
    console.error("응답이 없습니다.");
  }
}

function handleQuizCorrect(response) {
  console.log("callBack 퀴즈 정답 처리 response:", response);
  // 응답을 필요에 따라 처리
  if (response) {
    console.log("handleQuizCorrect 정답:", response);
  } else {
    console.error("응답이 없습니다.");
  }
}

function handleOCR(response) {
  console.log("callBack OCR Response:", response);
  // 응답을 필요에 따라 처리
  if (response) {
    const result = JSON.parse(response);
    console.log("OCR 결과:", result);
    resultOcrText = result?.resultText || "";
    resultOcrTextList = result?.resultTextList || [];
  } else {
    console.error("응답이 없습니다.");
  }

  activeOcrCheck = true;
}

function handleSTT(response) {
  console.log("callBack STT Response:", response);
  // 응답을 필요에 따라 처리
  if (response) {
    const result = JSON.parse(response);
    console.log("STT 결과:", result);
    resultSttText = result?.resultText;
    resultSttScore = result?.resultScore;
    resultSttCloseType = result?.closeType;
  } else {
    console.error("STT 응답이 없습니다.");
    resultSttCloseType = "close";
  }

  activeSttCheck = true;
}

// 함수를 전역 범위에 노출
window.set_QUIZ_INPUT = set_QUIZ_INPUT;
window.get_QUIZ_INPUT = get_QUIZ_INPUT;
window.set_QUIZ_CORRECT = set_QUIZ_CORRECT;
window.get_QUIZ_CORRECT = get_QUIZ_CORRECT;
window.call_OCR_DIRECT = call_OCR_DIRECT;
window.call_STT = call_STT;
window.call_STT_W_TEST = call_STT_W_TEST;
window.call_STT_S_TEST = call_STT_S_TEST;
window.callBackQuizInput = callBackQuizInput;
window.callBackQuizCorrect = callBackQuizCorrect;
window.callBackOCR = callBackOCR;
window.callBackSTT = callBackSTT;
window.handleQuizInput = handleQuizInput;
window.handleQuizCorrect = handleQuizCorrect;
window.handleOCR = handleOCR;
window.handleSTT = handleSTT;
