// password = 123456
const PASSWORD_HASH = "349cbccafc082902f6d88098da92b998129d98c079996b96f305705ffddc67baa935e07353a00b6068e6b0f8e1245ee8d499c80ece5232ad938825cb292bce3b"

export const generateAuthPassworded = (userId: any[]) => {
  return {
    tableName: "auth_user_passworded",
    headers: ["id", "user_id", "password"],
    types: ["string", "string", "string"],
    values: userId.map(v => [v, v, PASSWORD_HASH])
  }
}

export const generateAuthComp = (sheetName: string, values: any[][]) => {
  return {
    tableName: sheetName.replace("_impl", "_comp"),
    headers: ["id"],
    types: ["string"],
    values: values.map(v => [v[0]])
  }
}

export const generateImpl = (sheetName: string, headers: any[], types: any[], values: any[][]) => {
  const objectNameIdx = headers.findIndex(v => v === "modulesequence")

  return {
    tableName: sheetName.replace("_comp", "_impl"),
    headers: [headers[0]],
    types: [types[0]],
    values: values.filter(v => v[objectNameIdx] !== "null").map(v => [v[0]])
  }
}

export const generateTableOrder = (sheetName: string) => {
  if (sheetName === "auth_user_impl") return ["auth_user_comp", "auth_user_impl", "auth_user_passworded"]
  if (sheetName.startsWith("auth_")) return [sheetName.replace("_impl", "_comp"), sheetName]
  if (sheetName.endsWith("_comp")) return [sheetName, sheetName.replace("_comp", "_impl")]
  return [sheetName]
}