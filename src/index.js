import { check, group, sleep, fail } from "k6";
import http from "k6/http";
import { Rate } from "k6/metrics";
import { generateUser } from "./generators/user.js";
import { DebugOrLog } from "./utils/logs.util.js";

const DEBUG = true;
const start = Date.now();

const baseUrl = "https://thg-vaccine-dev-api.thonburibamrungmuang.com";
const lot = "lot2";

const urls = {
  getRegis: (lineId) => `${baseUrl}/api/v1/${lot}/regis/${lineId}`,
  submitRegis: `${baseUrl}/api/v1/${lot}/regis`,
  getOrder: (lineId) => `${baseUrl}/api/v1/${lot}/orders/${lineId}`,
  submitOrder: `${baseUrl}/api/v1/${lot}/orders`,
};

const getRegisFailRate = new Rate("failed get registration");
const getOrderFailRate = new Rate("failed get order");
const submitRegisFailRate = new Rate("failed create registration");
const submitOrderFailRate = new Rate("failed create order");

// export const options = {
//   vus: 300,
//   duration: "10s",
//   thresholds: {
//     "failed form submits": ["rate<0.1"],
//     "failed form fetches": ["rate<0.1"],
//     http_req_duration: ["p(95)<400"],
//   },
// };

export const options = {
  // vus: 10,
  // duration: "10s",
  stages: [
    { duration: "10s", target: 50 },
    { duration: "2m", target: 200 },
    { duration: "2m", target: 700 },
  ],
  thresholds: {
    "failed create registration": ["rate<0.1"],
    "failed get registration": ["rate<0.1"],
    "failed create order": ["rate<0.1"],
    "failed get order": ["rate<0.1"],
    http_req_duration: ["p(95)<500", "p(99)<1500"],
    "http_req_duration{name:FetchRegis}": ["avg<400", "max<5000"],
    "http_req_duration{name:FetchOrder}": ["avg<400", "max<5000"],
    "http_req_duration{name:SubmitRegis}": ["avg<600", "max<5000"],
    "http_req_duration{name:SubmitOrder}": ["avg<600", "max<5000"],
  },
};

const fetchRegister = (user, options) => {
  const res = http.get(urls.getRegis(user.line_reference), {
    tags: { name: "FetchRegis" },
  });

  const isFetchRegisterSuccess = check(res, {
    "Fetch Register succeed": () => res.status == options.expect,
  });

  getRegisFailRate.add(!isFetchRegisterSuccess);
};

const fetchOrder = (user, options) => {
  const res = http.get(urls.getOrder(user.line_reference), {
    tags: { name: "FetchOrder" },
  });

  const isFetchOrderSuccess = check(res, {
    "Fetch Order succeed": () => res.status == options.expect,
  });

  getOrderFailRate.add(!isFetchOrderSuccess);
};

const submitRegister = (user) => {
  const payload = JSON.stringify(user);

  const res = http.post(urls.submitRegis, payload, {
    tags: { name: "SubmitRegis" },
  });

  const isSuccessfulRequest = check(res, {
    "Submit Register succeed": () => res.status == 201,
  });

  submitRegisFailRate.add(!isSuccessfulRequest);

  if (isSuccessfulRequest) {
    DebugOrLog(`Registration Created`);
  } else {
    DebugOrLog(`Unable to create a Registration ${res.status} ${res.body}`);
  }
};

const submitOrder = (user) => {
  const paymentInfo = {
    line_reference: user.line_reference,
    qty: 1,
    payment_method: "card",
  };
  const payload = JSON.stringify(paymentInfo);

  const res = http.post(urls.submitOrder, payload, {
    tags: { name: "SubmitOrder" },
  });

  const isSuccessfulRequest = check(res, {
    "Submit Order succeed": () => res.status == 201,
  });

  submitOrderFailRate.add(!isSuccessfulRequest);

  if (isSuccessfulRequest) {
    DebugOrLog(`Order Created`);
  } else {
    DebugOrLog(`Unable to create an Order ${res.status} ${res.body}`);
  }
};

export default function () {
  const user = generateUser();

  // Registration Flow
  fetchRegister(user, { expect: 404 });
  fetchOrder(user, { expect: 404 });
  submitRegister(user);
  fetchRegister(user, { expect: 200 });

  // Order Creation Flow
  submitOrder(user);
  // fetchOrder(user, { expect: 200 });

  sleep(1);
}
