type t11 = "";
type t12 = "";
type t13 = "";
type t14 = "";

type t2 = t11 & {
	xiaozhang: "zzzz";
}

type t3<T extends string> = T extends "11" ? "11" : "22"; 

interface IProps {
	name: "zzz" | number;
	opt: {
		auto: false;
		literal: "111"
	}
}

enum enum1 {
	SINGLE = "1",
	DOUBLE = "2",
	NONE = "0"
}

function getName(param1: "zzz")
function getName(param2: "zzz"): "name" {
	return "name";
}

const aaa: string = "a" as "a";
const bbb: string = "b" satisfies "b";