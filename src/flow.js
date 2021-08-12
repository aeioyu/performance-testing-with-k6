import http from "k6/http";
import { check, group, sleep, fail } from "k6";

// Process arguments
var TOKEN_USERNAME = "fakeuser"; // default
if (__ENV.TOKEN_USERNAME) {
  TOKEN_USERNAME = __ENV.TOKEN_USERNAME;
}

var TOKEN_PASSWORD = "fakepassword"; // default
if (__ENV.TOKEN_PASSWORD) {
  TOKEN_PASSWORD = __ENV.TOKEN_PASSWORD;
}

var TEST_2_RUN = "smoke"; // default
if (__ENV.TEST_2_RUN) {
  TEST_2_RUN = __ENV.TEST_2_RUN;
}

var ENV_2_RUN = "dev"; // default
if (__ENV.ENV_2_RUN) {
  ENV_2_RUN = __ENV.ENV_2_RUN;
}

// Constants
const EnvToRun = {
  dev: "dev",
  test: "test",
  prod: "prod",
};

// Parameters & Constants
const BASE_URL = "https://test-api.k6.io";

export let options = {
  vus: 1,
  duration: "5s",
  thresholds: {
    http_req_failed: ["rate<0.05"],
    http_req_duration: ["p(95)<500", "p(99)<1500"],
    "http_req_duration{name:PublicCrocs}": ["avg<400"],
    "http_req_duration{name:k6SiteUIcheck}": ["avg<400"],
    "http_req_duration{name:Create}": ["avg<600", "max<1000"],
  },
};

function randomString(length) {
  const charset = "abcdefghijklmnopqrstuvwxyz";
  let res = "";
  while (length--) res += charset[(Math.random() * charset.length) | 0];

  return res;
}

export default function () {
  const requestConfigWithTag = (tag) => ({
    tags: Object.assign(
      {
        name: "PrivateCrocs",
      },
      tag
    ),
  });

  group("Create and modify crocs", () => {
    let URL = `${BASE_URL}/my/crocodiles/`;

    group("Create crocs", () => {
      const payload = {
        name: `Name ${randomString(10)}`,
        sex: "M",
        date_of_birth: "2001-01-01",
      };

      const res = http.post(
        URL,
        payload,
        requestConfigWithTag({ name: "Create" })
      );

      if (check(res, { "Croc created correctly": (r) => r.status === 201 })) {
        URL = `${URL}${res.json("id")}/`;
      } else {
        DebugOrLog(`Unable to create a Croc ${res.status} ${res.body}`);

        return;
      }
    });

    group("Update croc", () => {
      const payload = { name: "New name" };
      const res = http.patch(
        URL,
        payload,
        requestConfigWithTag({ name: "Update" })
      );
      const isSuccessfulUpdate = check(res, {
        "Update worked": () => res.status === 200,
        "Updated name is correct": () => res.json("name") === "New name",
      });

      if (!isSuccessfulUpdate) {
        DebugOrLog(`Unable to update the croc ${res.status} ${res.body}`);
        return;
      }
    });

    const delRes = http.del(
      URL,
      null,
      requestConfigWithTag({ name: "Delete" })
    );

    const isSuccessfulDelete = check(null, {
      "Croc was deleted correctly": () => delRes.status === 204,
    });

    if (!isSuccessfulDelete) {
      DebugOrLog(`Croc was not deleted properly`);
      return;
    }
  });

  sleep(1);
}
