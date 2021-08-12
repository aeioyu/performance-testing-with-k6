function randomString(length) {
  const charset = "abcdefghijklmnopqrstuvwxyz";
  let res = "";
  while (length--) res += charset[(Math.random() * charset.length) | 0];

  return res;
}

export function generateUser() {
  return {
    line_reference: randomString(10),
    first_name: "Loadtest",
    last_name: "Lastname",
    user_id: "user_id",
    id_type: "citizen_id",
    email: "test@test.com",
    tel: "0800000000",
    date_of_birth: "1999-01-01 00:00:00",
    syndrome: {
      chronic_respiratory_disease: false,
      cardiovascular_disease: false,
      chronic_kidney_disease: false,
      cerebrovascular_disease: false,
      cancer_during_treatment: false,
      diabetes: false,
      obesity: false,
      other: "test",
    },
    location: "fake_location",
    hospital: "fake_hospital",
  };
}
