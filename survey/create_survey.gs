/**
 * 동서석유화학 구내식당 이용 만족도 조사 - Google 설문지 자동 생성
 *
 * 사용법
 * 1) https://script.google.com 접속 → [새 프로젝트]
 * 2) 기본 코드를 모두 지우고 이 파일 전체를 붙여넣기
 * 3) 상단 함수 선택에서 createCanteenSurvey 선택 → [실행]
 * 4) 최초 1회 권한 승인(Google Forms, Drive) 후 실행 로그에서 "응답 URL" 확인
 *
 * 구조: 섹션1(Q1~Q3) → [Q3 '있습니다'] 섹션2(Q4,Q5) → 섹션3~6 중 하나(선택) → 섹션7(Q6)
 *       Q3 '없습니다/기억하기 어렵습니다'는 즉시 제출
 */
function createCanteenSurvey() {
  const form = FormApp.create('동서석유화학 구내식당 이용 만족도 조사');

  // ── 기본 설정 (익명) ─────────────────────────────
  form.setDescription(
    '최근 2주 동안 이용하신 식사를 떠올리며 답해 주세요. ' +
    '이름과 연락처는 묻지 않습니다. ' +
    '좋은 점은 유지하고, 아쉬운 점은 개선하는 데 의견을 활용하겠습니다.'
  );
  form.setConfirmationMessage(
    '참여해 주셔서 감사합니다. 남겨주신 의견은 식사와 이용환경을 점검하는 데 활용하겠습니다.'
  );
  form.setCollectEmail(false);            // 이메일 수집 안 함
  form.setLimitOneResponsePerUser(false); // 응답 1회 제한 해제
  form.setAllowResponseEdits(false);
  form.setShowLinkToRespondAgain(false);
  form.setProgressBar(false);
  try { form.setRequireLogin(false); } catch (e) { Logger.log('setRequireLogin 건너뜀: ' + e); } // Workspace 전용
  try { form.setPublishingSummary(false); } catch (e) {}

  // ── 섹션 1 (첫 화면) ────────────────────────────
  const q1 = form.addMultipleChoiceItem();
  q1.setTitle('Q1. 소속·응답 구분을 선택해 주세요.')
    .setHelpText('생산 1·2·3팀 소속이면 해당 팀을, 총무·사무 업무 담당자는 사무·관리를 선택해 주세요. ' +
                 '여기서 일근직은 앞의 네 구분에 속하지 않는 별도 일근 근무자를 뜻합니다.')
    .setChoiceValues(['생산 1팀', '생산 2팀', '생산 3팀', '사무·관리', '일근직'])
    .setRequired(true);

  const q2 = form.addMultipleChoiceItem();
  q2.setTitle('Q2. 현재 근무형태는 무엇입니까?')
    .setChoiceValues(['일근직(주간 고정 근무)', '교대직(교대 일정에 따른 근무)'])
    .setRequired(true);

  const q3 = form.addMultipleChoiceItem();
  q3.setTitle('Q3. 최근 2주 동안 이 구내식당의 식사를 드신 적이 있습니까?')
    .setRequired(true);
  // 선택지는 이동할 섹션이 만들어진 뒤에 설정

  // ── 섹션 2 ──────────────────────────────────────
  const page2 = form.addPageBreakItem().setTitle('식사 만족도');

  const q4 = form.addMultipleChoiceItem();
  q4.setTitle('Q4. 최근 2주 동안 드신 식사에 전반적으로 얼마나 만족하십니까?')
    .setChoiceValues(['매우 만족', '만족', '보통', '불만족', '매우 불만족', '판단하기 어려움'])
    .setRequired(true);

  const q5 = form.addMultipleChoiceItem();
  q5.setTitle('Q5. 가장 먼저 개선되었으면 하는 점을 한 가지만 골라 주세요.')
    .setRequired(true);

  // ── 섹션 3~6 (조건부, 선택 응답) ────────────────
  const page3 = form.addPageBreakItem().setTitle('음식 상세 (선택)');
  form.addMultipleChoiceItem()
    .setTitle('Q5-1. 음식에서 가장 먼저 개선되었으면 하는 부분은 무엇입니까?')
    .setChoiceValues(['국·찌개·탕의 맛·간', '반찬의 맛·구성', '밥의 상태', '음식량', '음식 온도', '기타'])
    .setRequired(false);

  const page4 = form.addPageBreakItem().setTitle('위생 상세 (선택)');
  form.addMultipleChoiceItem()
    .setTitle('Q5-1. 청결에서 어느 부분이 가장 아쉬웠습니까?')
    .setChoiceValues(['식판·수저·컵', '테이블·식당 환경', '둘 다', '기타'])
    .setRequired(false);

  const page5 = form.addPageBreakItem().setTitle('이용 서비스 상세 (선택)');
  form.addMultipleChoiceItem()
    .setTitle('Q5-1. 이용할 때 어느 부분이 가장 아쉬웠습니까?')
    .setChoiceValues(['음식 보충 속도', '직원의 말투·친절', '필요한 안내', '기타'])
    .setRequired(false);

  const page6 = form.addPageBreakItem().setTitle('기타 의견 (선택)');
  form.addTextItem()
    .setTitle('Q5-1. 바라는 점이 있다면 한 줄로 적어 주세요.')
    .setRequired(false);

  // ── 섹션 7 (마지막 화면) ────────────────────────
  const page7 = form.addPageBreakItem().setTitle('유지했으면 하는 점');
  form.addMultipleChoiceItem()
    .setTitle('Q6. 앞으로도 계속 유지했으면 하는 좋은 점이 있다면, 한 가지만 골라 주세요.')
    .setChoiceValues([
      '음식: 맛·메뉴·양 등',
      '위생·청결',
      '이용 서비스: 직원 응대·안내 등',
      '기타',
      '특별히 없음'
    ])
    .setRequired(true);

  // ── 분기 연결 ───────────────────────────────────
  // Q3: 있습니다 → 섹션2 / 없습니다·기억하기 어렵습니다 → 제출
  q3.setChoices([
    q3.createChoice('있습니다', page2),
    q3.createChoice('없습니다', FormApp.PageNavigationType.SUBMIT),
    q3.createChoice('기억하기 어렵습니다', FormApp.PageNavigationType.SUBMIT)
  ]);

  // Q5: 항목별 상세 섹션 / 특별히 없음 → 섹션7
  q5.setChoices([
    q5.createChoice('음식: 국·반찬·맛·메뉴·양·온도', page3),
    q5.createChoice('위생: 식기·식당 청결', page4),
    q5.createChoice('이용 서비스: 음식 보충·직원 응대', page5),
    q5.createChoice('기타', page6),
    q5.createChoice('지금은 특별히 없음', page7)
  ]);

  // 섹션 3~6 종료 후 반드시 섹션 7로 이동
  [page3, page4, page5, page6].forEach(function (p) { p.setGoToPage(page7); });

  // ── 게시 ────────────────────────────────────────
  form.setAcceptingResponses(true);
  try { if (typeof form.setPublished === 'function') form.setPublished(true); } catch (e) {}

  Logger.log('=== 생성 완료 ===');
  Logger.log('응답 URL(QR용): ' + form.getPublishedUrl());
  Logger.log('편집 URL: ' + form.getEditUrl());
  Logger.log('※ 응답 URL을 시크릿 창에서 열어 아래 4가지 경로를 꼭 시험해 보세요.');
  Logger.log('  ① Q3 없음 → 즉시 제출  ② Q3 기억 어려움 → 즉시 제출');
  Logger.log('  ③ Q5 음식/위생/서비스/기타 → 해당 섹션 → Q6  ④ Q5 특별히 없음 → Q6 직행');
}
