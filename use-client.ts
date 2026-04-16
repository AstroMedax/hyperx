
import Hyperx from "./hyperx/index";
import cli from "./util/cli/cli";

const [client, err_url] = Hyperx.create(
  "hyperx://localhost:4636",
  "secret-key",
);

async function main() {
  let method = await cli.input("masukkan method: ");
  if (err_url) {
    console.log(err_url.message);
    return;
  }
  if (method == "get") {
    await Get();
  } else if (method == "add") {
    await Insert();
  } else if (method == "delete") {
    await Delete();
  } else if (method == "health") {
    await Health();
  } else if (method == "flush") {
    await Flush();
  }
  main();
}



async function Insert() {
  const [res, setErr] = await client!.SET("user:1", { nama: "tio" });

  if (setErr) {
    console.log(setErr.message);
  }
  console.log(res);
  await client!.disconnect();
}

async function Delete() {
  const [res, setErr] = await client!.DELETE("user:1");

  if (setErr) {
    console.log(setErr.message);
  }
  console.log(res);
  await client!.disconnect();
}

async function Get() {
  const [res, setErr] = await client!.GET("user:1");

  if (setErr) {
    console.log(setErr.message);
  }
  console.log(res);
  await client!.disconnect();
}
async function Health() {
  const [res, setErr] = await client!.HEALTH();

  if (setErr) {
    console.log(setErr.message);
  }
  console.log(res);
  await client!.disconnect();
}

async function Flush() {
  const [res, setErr] = await client!.FLUSH();

  if (setErr) {
    console.log(setErr.message);
  }
  console.log(res);
  await client!.disconnect();
}

main();
