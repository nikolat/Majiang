"use strict";

const sspServerURL = 'http://localhost:9801';

/*
window.RequestDapai = async function(data) {
	const hwnd = data[0];
	const id = data[1];
	const zimo = data[2];
	const option = data[3];
	const mes1 = ''
		+ 'NOTIFY SSTP/1.1\n'
		+ 'Charset: UTF-8\n'
		+ 'Sender: Majiang\n'
		+ 'SecurityLevel: local\n'
		+ 'Event: OnMahjong\n'
		+ 'Option: nobreak\n'
		+ 'ReceiverGhostHWnd: ' + hwnd + '\n'
		+ 'Reference0: UKAJONG/0.2\n'
		+ 'Reference1: sutehai?\n'
		+ '\n';
	const res = await postData(sspServerURL + '/api/sstp/v1', mes1);
	const lines = res.split('\r\n');
	let command;
	let dapai;
	for (let i = 0; i < lines.length; i++) {
		if (lines[i].indexOf('X-SSTP-PassThru-Reference2: ') >= 0) {
			command = lines[i].split('X-SSTP-PassThru-Reference2: ')[1].replace('\r', '');
		}
		else if (lines[i].indexOf('X-SSTP-PassThru-Reference3: ') >= 0) {
			dapai = lines[i].split('X-SSTP-PassThru-Reference3: ')[1].replace('\r', '');
		}
	}
	game._players[id].action_zimo_from_ghost(zimo, option, command, dapai);
};
*/

async function SendSSTP(data) {
	const hwnd = data[0];
	let mes = ''
	+ 'NOTIFY SSTP/1.1\n'
	+ 'Charset: UTF-8\n'
	+ 'Sender: Majiang\n'
	+ 'SecurityLevel: local\n'
	+ 'Event: OnMahjong\n'
	+ 'Option: nobreak\n'
	+ 'ReceiverGhostHWnd: ' + hwnd + '\n'
	+ 'Reference0: UKAJONG/0.2\n'
	for (let i = 1; i < data.length; i++) {
		mes += 'Reference' + i + ': ' + data[i] + '\n';
	}
	mes += '\n';
	const res = await postData(sspServerURL + '/api/sstp/v1', mes);
console.log(mes);
console.log('----------');
console.log(res);
console.log('----------');
};

async function postData(url = '', data = '') {
	const param = {
		method: 'POST',
		headers: {
			'Content-Type': 'text/plain',
			'Origin': sspServerURL
		},
		body: data
	};
	try {
		const response = await fetch(url, param);
		return response.text()
	} catch (error) {
console.log(error);
		return '';
	}
}

//FMOから起動中のゴースト情報を取得
export async function RequestPlayerInfo() {
	const mes1 = ''
		+ 'EXECUTE SSTP/1.1\n'
		+ 'Charset: UTF-8\n'
		+ 'SecurityLevel: external\n'
		+ 'Command: GetFMO\n'
		+ '\n';
	const res = await postData(sspServerURL + '/api/sstp/v1', mes1);
console.log(mes1);
console.log('----------');
console.log(res);
console.log('----------');
	const lines = res.split('\r\n');
	const hwnd_tmp = [];
	const name_tmp = [];
	for (let i = 0; i < lines.length; i++) {
		if (lines[i].indexOf('.hwnd' + String.fromCharCode(1)) >= 0) {
			const hwnd = lines[i].split(String.fromCharCode(1))[1].replace('\r', '');
			hwnd_tmp.push(hwnd);
		}
		else if (lines[i].indexOf('.name' + String.fromCharCode(1)) >= 0) {
			const name = lines[i].split(String.fromCharCode(1))[1].replace('\r', '');
			name_tmp.push(name);
		}
	}
	const hwnds = [];
	const names = [];
	const hwnd_dict = {};
	for (let i = 0; i < name_tmp.length; i++) {
		hwnd_dict[name_tmp[i]] = hwnd_tmp[i];
		const mes2 = ''
			+ 'NOTIFY SSTP/1.1\n'
			+ 'Charset: UTF-8\n'
			+ 'Sender: Majiang\n'
			+ 'SecurityLevel: local\n'
			+ 'Event: OnMahjong\n'
			+ 'Option: nobreak\n'
			+ 'ReceiverGhostHWnd: ' + hwnd_tmp[i] + '\n'
			+ 'Reference0: UKAJONG/0.2\n'
			+ 'Reference1: hello\n'
			+ '\n';
		const res = await postData(sspServerURL + '/api/sstp/v1', mes2);
console.log(mes2);
console.log('----------');
console.log(res);
console.log('----------');
		const lines = res.split('\r\n');
		for (let i = 0; i < lines.length; i++) {
			if (lines[i].indexOf('X-SSTP-PassThru-Reference3: name=') >= 0) {
				const name = lines[i].split('X-SSTP-PassThru-Reference3: name=')[1].replace('\r', '');
				names.push(name);
				hwnds.push(hwnd_dict[name]);
			}
		}
	}
	return [names, hwnds];
};

export class UkajongGame extends Majiang.Game {

    constructor(players, callback, rule, title, names, hwnds) {
        super(players, callback, rule, title);
        for (let i = 0; i < names.length; i++) {
            let n = (i + 1) % 4;
            this._model.player[n] = names[i];
            this._players[n]._hwnd = hwnds[i];
            if (i == 3) {
                break;
            }
        }
	}

	reply_zimo() {
		let model = this._model;

		let reply = this.get_reply(model.lunban);
		if (reply.daopai) {
			if (this.allow_pingju()) {
				let shoupai = ['','','',''];
				shoupai[model.lunban] = model.shoupai[model.lunban].toString();
				return this.delay(()=>this.pingju('九種九牌', shoupai), 0);
			}
		}
		else if (reply.hule) {
			if (this.allow_hule()) {
				if (this._view) this._view.say('zimo', model.lunban);
				for (let l = 0; l < 4; l++) {
					if (this._players[l]._hwnd)
						SendSSTP([this._players[l]._hwnd, 'say', this._model.player[this._model.player_id[this._model.lunban]], 'tsumo']);
				}
				return this.delay(()=>this.hule());
			}
		}
		else if (reply.gang) {
			if (this.get_gang_mianzi().find(m => m == reply.gang)) {
				if (this._view) this._view.say('gang', model.lunban);
				for (let l = 0; l < 4; l++) {
					if (this._players[l]._hwnd)
						SendSSTP([this._players[l]._hwnd, 'say', this._model.player[this._model.player_id[this._model.lunban]], 'kan']);
				}
				return this.delay(()=>this.gang(reply.gang));
			}
		}
		else if (reply.dapai) {
			let dapai = reply.dapai.replace(/\*$/,'');
			if (this.get_dapai().find(p => p == dapai)) {
				if (reply.dapai.substr(-1) == '*' && this.allow_lizhi(dapai)) {
					if (this._view) this._view.say('lizhi', model.lunban);
					for (let l = 0; l < 4; l++) {
						if (this._players[l]._hwnd)
								SendSSTP([this._players[l]._hwnd, 'say', this._model.player[this._model.player_id[this._model.lunban]], 'richi']);
					}
					return this.delay(()=>this.dapai(reply.dapai));
				}
				return this.delay(()=>this.dapai(dapai), 0);
			}
		}

		let p = this.get_dapai().pop();
		this.delay(()=>this.dapai(p), 0);
	}

	reply_dapai() {

		let model = this._model;

		for (let i = 1; i < 4; i++) {
			let l = (model.lunban + i) % 4;
			let reply = this.get_reply(l);
			if (reply.hule && this.allow_hule(l)) {
				if (this._rule['最大同時和了数'] == 1  && this._hule.length)
																	continue;
				if (this._view) this._view.say('rong', l);
				for (let j = 0; j < 4; j++) {
					if (this._players[j]._hwnd)
						SendSSTP([this._players[j]._hwnd, 'say', this._model.player[this._model.player_id[l]], 'ron']);
				}
				this._hule.push(l);
			}
			else {
				let shoupai = model.shoupai[l].clone().zimo(this._dapai);
				if (Majiang.Util.xiangting(shoupai) == -1)
												this._neng_rong[l] = false;
			}
		}
		if (this._hule.length == 3 && this._rule['最大同時和了数'] == 2) {
			let shoupai = ['','','',''];
			for (let l of this._hule) {
				shoupai[l] = model.shoupai[l].toString();
			}
			return this.delay(()=>this.pingju('三家和', shoupai));
		}
		else if (this._hule.length) {
			return this.delay(()=>this.hule());
		}

		if (this._dapai.substr(-1) == '*') {
			model.defen[model.player_id[model.lunban]] -= 1000;
			model.lizhibang++;

			if (this._lizhi.filter(x=>x).length == 4
				&& this._rule['途中流局あり'])
			{
				let shoupai = model.shoupai.map(s=>s.toString());
				return this.delay(()=>this.pingju('四家立直', shoupai));
			}
		}

		if (this._diyizimo && model.lunban == 3) {
			this._diyizimo = false;
			if (this._fengpai) {
				return this.delay(()=>this.pingju('四風連打'), 0);
			}
		}

		if (this._n_gang.reduce((x, y)=> x + y) == 4) {
			if (Math.max(...this._n_gang) < 4 && this._rule['途中流局あり']) {
				return this.delay(()=>this.pingju('四開槓'), 0);
			}
		}

		if (! model.shan.paishu) {
			let shoupai = ['','','',''];
			for (let l = 0; l < 4; l++) {
				let reply = this.get_reply(l);
				if (reply.daopai) shoupai[l] = reply.daopai;
			}
			return this.delay(()=>this.pingju('', shoupai), 0);
		}

		for (let i = 1; i < 4; i++) {
			let l = (model.lunban + i) % 4;
			let reply = this.get_reply(l);
			if (reply.fulou) {
				let m = reply.fulou.replace(/0/g,'5');
				if (m.match(/^[mpsz](\d)\1\1\1/)) {
					if (this.get_gang_mianzi(l).find(m => m == reply.fulou)) {
						if (this._view) this._view.say('gang', l);
						for (let j = 0; j < 4; j++) {
							if (this._players[j]._hwnd)
								SendSSTP([this._players[j]._hwnd, 'say', this._model.player[this._model.player_id[l]], 'kan']);
						}
						return this.delay(()=>this.fulou(reply.fulou));
					}
				}
				else if (m.match(/^[mpsz](\d)\1\1/)) {
					if (this.get_peng_mianzi(l).find(m => m == reply.fulou)) {
						if (this._view) this._view.say('peng', l);
						for (let j = 0; j < 4; j++) {
							if (this._players[j]._hwnd)
								SendSSTP([this._players[j]._hwnd, 'say', this._model.player[this._model.player_id[l]], 'pon']);
						}
						return this.delay(()=>this.fulou(reply.fulou));
					}
				}
			}
		}
		let l = (model.lunban + 1) % 4;
		let reply = this.get_reply(l);
		if (reply.fulou) {
			if (this.get_chi_mianzi(l).find(m => m == reply.fulou)) {
				if (this._view) this._view.say('chi', l);
				for (let j = 0; j < 4; j++) {
					if (this._players[j]._hwnd)
						SendSSTP([this._players[j]._hwnd, 'say', this._model.player[this._model.player_id[l]], 'chi']);
				}
				return this.delay(()=>this.fulou(reply.fulou));
			}
		}

		this.delay(()=>this.zimo(), 0);
	}
}

export class UkajongPlayer extends Majiang.UI.Player {

	constructor(root, pai) {
        super(root, pai);
    }

	to_ump(pai) {
		let r = '';
		let c = '';
		for (let i = 0; i < pai.length; i++) {
			let s = pai.substring(i, i + 1);
			if (s.match(/[_\*\-+=]/)) {
			}
			else if (!s.match(/\d/)) {
				c = s;
			}
			else {
				r += s.replace(/0/, '5') + c;
			}
		}
		return r;
	}
	
	from_ump(pai) {
		let r = '';
		let c = '';
		let n = -1;
		for (let i = 0; i < pai.length; i++) {
			let s = pai.substring(i, i + 1);
			if (s.match(/\d/)) {
				n = 1 * s;
			}
			else if (s.match(/[mpsz]/)) {
				if (c == s) {
					r += n;
				}
				else {
					c = s;
					r += c + n;
				}
			}
		}
		return r;
	}
	
	replace_zero_if_none(pai) {
		let r = pai;
		if (pai == 'm5' && this.shoupai._bingpai.m[5] == 0) {
			r = 'm0';
		}
		else if (pai == 'p5' && this.shoupai._bingpai.p[5] == 0) {
			r = 'p0';
		}
		else if (pai == 's5' && this.shoupai._bingpai.s[5] == 0) {
			r = 's0';
		}
		return r;
	}

	kaiju(kaiju) {
        super.kaiju(kaiju);
		if (this._hwnd) {
			SendSSTP([this._hwnd, 'gamestart', ['東', '南', '西', '北'][(4 + this._id - kaiju.qijia) % 4], kaiju.player[0], kaiju.player[1], kaiju.player[2], kaiju.player[3]]);
		}
	}
    qipai(qipai) {
        super.qipai(qipai);
		const jushu = (4 + this._model.menfeng(this._id) - this._id + this._model.qijia) % 4;
		const player = [this._model.player[(4 - jushu) % 4], this._model.player[(5 - jushu) % 4], this._model.player[(6 - jushu) % 4], this._model.player[(7 - jushu) % 4]];
		if (this._hwnd) {
			SendSSTP([this._hwnd, 'kyokustart', ['東', '南', '西', '北'][qipai.zhuangfeng], player[this._model.qijia], qipai.changbang, 1000 * qipai.lizhibang]);
			SendSSTP([this._hwnd, 'dora', this.to_ump(qipai.baopai)]);
			SendSSTP([this._hwnd, 'haipai', this._model.player[this._id], this.to_ump(this.shoupai.toString())]);
		}
	}
    zimo(zimo, gangzimo) {
        super.zimo(zimo, gangzimo);
		const jushu = (4 + this._model.menfeng(this._id) - this._id + this._model.qijia) % 4;
		const player = [this._model.player[(4 - jushu) % 4], this._model.player[(5 - jushu) % 4], this._model.player[(6 - jushu) % 4], this._model.player[(7 - jushu) % 4]];
		if (this._hwnd && zimo.l == this._model.menfeng(this._id)) {
			SendSSTP([this._hwnd, 'tsumo', player[(this._model.qijia + zimo.l) % 4], this.shan.paishu, this.to_ump(zimo.p)]);
		}
	}
    dapai(dapai) {
        super.dapai(dapai);
		const jushu = (4 + this._model.menfeng(this._id) - this._id + this._model.qijia) % 4;
		const player = [this._model.player[(4 - jushu) % 4], this._model.player[(5 - jushu) % 4], this._model.player[(6 - jushu) % 4], this._model.player[(7 - jushu) % 4]];
		if (this._hwnd) {
			SendSSTP([this._hwnd, 'sutehai', player[(this._model.qijia + dapai.l) % 4], this.to_ump(dapai.p)]);
		}
	}
    fulou(fulou) {
        super.fulou(fulou);
		const jushu = (4 + this._model.menfeng(this._id) - this._id + this._model.qijia) % 4;
		const player = [this._model.player[(4 - jushu) % 4], this._model.player[(5 - jushu) % 4], this._model.player[(6 - jushu) % 4], this._model.player[(7 - jushu) % 4]];
		if (this._hwnd) {
			SendSSTP([this._hwnd, 'open', player[(this._model.qijia + fulou.l) % 4], this.to_ump(fulou.m)]);
		}
	}
    gang(gang)   {
        super.gang(gang);
		const jushu = (4 + this._model.menfeng(this._id) - this._id + this._model.qijia) % 4;
		const player = [this._model.player[(4 - jushu) % 4], this._model.player[(5 - jushu) % 4], this._model.player[(6 - jushu) % 4], this._model.player[(7 - jushu) % 4]];
		if (this._hwnd) {
			if (gang.m.match(/^[mpsz]\d{4}/))
				SendSSTP([this._hwnd, 'open', player[(this._model.qijia + gang.l) % 4], this.to_ump(gang.m)]);
			else
				SendSSTP([this._hwnd, 'open', player[(this._model.qijia + gang.l) % 4], this.to_ump(gang.m.substr(0,2))]);
		}
	}
    kaigang(kaigang) {
        super.kaigang(kaigang);
		if (this._hwnd) {
			SendSSTP([this._hwnd, 'dora', this.to_ump(kaigang.baopai)]);
		}
	}
	hule(hule) {
        super.hule(hule);
		const jushu = (4 + this._model.menfeng(this._id) - this._id + this._model.qijia) % 4;
		const player = [this._model.player[(4 - jushu) % 4], this._model.player[(5 - jushu) % 4], this._model.player[(6 - jushu) % 4], this._model.player[(7 - jushu) % 4]];
		if (this._hwnd) {
			SendSSTP([this._hwnd, 'agari', player[(hule.l + this._model.qijia) % 4], hule.fu]);
			if (hule.fubaopai)
				SendSSTP([this._hwnd, 'dora', this.to_ump(hule.fubaopai.join(''))]);
			for (let i = 0; i < 4; i++) {
				if (!hule.fenpei[i])
					continue;
				SendSSTP([this._hwnd, 'point', player[(i + this._model.qijia) % 4], hule.fenpei[i] > 0 ? '+' : '-', Math.abs(hule.fenpei[i])]);
			}
			SendSSTP([this._hwnd, 'kyokuend']);
		}
	}
	pingju(pingju) {
        super.pingju(pingju);
		const jushu = (4 + this._model.menfeng(this._id) - this._id + this._model.qijia) % 4;
		const player = [this._model.player[(4 - jushu) % 4], this._model.player[(5 - jushu) % 4], this._model.player[(6 - jushu) % 4], this._model.player[(7 - jushu) % 4]];
		if (this._hwnd) {
			SendSSTP([this._hwnd, 'ryukyoku']);
			for (let i = 0; i < 4; i++) {
				if (!pingju.fenpei[i])
					continue;
				SendSSTP([this._hwnd, 'point', player[(i + this._model.qijia) % 4], pingju.fenpei[i] > 0 ? '+' : '-', Math.abs(pingju.fenpei[i])]);
			}
			SendSSTP([this._hwnd, 'kyokuend']);
		}
	}
	jieju(jieju)   {
        super.jieju(jieju);
		const player = this._model.player;
		if (this._hwnd) {
			SendSSTP([this._hwnd, 'gameend', player[0] + String.fromCharCode(1) + jieju.defen[0], player[1] + String.fromCharCode(1) + jieju.defen[1], player[2] + String.fromCharCode(1) + jieju.defen[2], player[3] + String.fromCharCode(1) + jieju.defen[3]]);
		}
	}
}

export class UkajongAI extends Majiang.AI {
	to_ump(pai) {
		let r = '';
		let c = '';
		for (let i = 0; i < pai.length; i++) {
			let s = pai.substring(i, i + 1);
			if (s.match(/[_\*\-+=]/)) {
			}
			else if (!s.match(/\d/)) {
				c = s;
			}
			else {
				r += s.replace(/0/, '5') + c;
			}
		}
		return r;
	}
	
	from_ump(pai) {
		let r = '';
		let c = '';
		let n = -1;
		for (let i = 0; i < pai.length; i++) {
			let s = pai.substring(i, i + 1);
			if (s.match(/\d/)) {
				n = 1 * s;
			}
			else if (s.match(/[mpsz]/)) {
				if (c == s) {
					r += n;
				}
				else {
					c = s;
					r += c + n;
				}
			}
		}
		return r;
	}
	
	replace_zero_if_none(pai) {
		let r = pai;
		if (pai == 'm5' && this.shoupai._bingpai.m[5] == 0) {
			r = 'm0';
		}
		else if (pai == 'p5' && this.shoupai._bingpai.p[5] == 0) {
			r = 'p0';
		}
		else if (pai == 's5' && this.shoupai._bingpai.s[5] == 0) {
			r = 's0';
		}
		return r;
	}

	kaiju(kaiju) {
        super.kaiju(kaiju);
		if (this._hwnd) {
			SendSSTP([this._hwnd, 'gamestart', ['東', '南', '西', '北'][(4 + this._id - kaiju.qijia) % 4], kaiju.player[0], kaiju.player[1], kaiju.player[2], kaiju.player[3]]);
		}
	}
    qipai(qipai) {
        super.qipai(qipai);
		const jushu = (4 + this._model.menfeng(this._id) - this._id + this._model.qijia) % 4;
		const player = [this._model.player[(4 - jushu) % 4], this._model.player[(5 - jushu) % 4], this._model.player[(6 - jushu) % 4], this._model.player[(7 - jushu) % 4]];
		if (this._hwnd) {
			SendSSTP([this._hwnd, 'kyokustart', ['東', '南', '西', '北'][qipai.zhuangfeng], player[this._model.qijia], qipai.changbang, 1000 * qipai.lizhibang]);
			SendSSTP([this._hwnd, 'dora', this.to_ump(qipai.baopai)]);
			SendSSTP([this._hwnd, 'haipai', this._model.player[this._id], this.to_ump(this.shoupai.toString())]);
		}
	}
    zimo(zimo, gangzimo) {
        super.zimo(zimo, gangzimo);
		const jushu = (4 + this._model.menfeng(this._id) - this._id + this._model.qijia) % 4;
		const player = [this._model.player[(4 - jushu) % 4], this._model.player[(5 - jushu) % 4], this._model.player[(6 - jushu) % 4], this._model.player[(7 - jushu) % 4]];
		if (this._hwnd && zimo.l == this._model.menfeng(this._id)) {
			SendSSTP([this._hwnd, 'tsumo', player[(this._model.qijia + zimo.l) % 4], this.shan.paishu, this.to_ump(zimo.p)]);
		}
	}
    dapai(dapai) {
        super.dapai(dapai);
		const jushu = (4 + this._model.menfeng(this._id) - this._id + this._model.qijia) % 4;
		const player = [this._model.player[(4 - jushu) % 4], this._model.player[(5 - jushu) % 4], this._model.player[(6 - jushu) % 4], this._model.player[(7 - jushu) % 4]];
		if (this._hwnd) {
			SendSSTP([this._hwnd, 'sutehai', player[(this._model.qijia + dapai.l) % 4], this.to_ump(dapai.p)]);
		}
	}
    fulou(fulou) {
        super.fulou(fulou);
		const jushu = (4 + this._model.menfeng(this._id) - this._id + this._model.qijia) % 4;
		const player = [this._model.player[(4 - jushu) % 4], this._model.player[(5 - jushu) % 4], this._model.player[(6 - jushu) % 4], this._model.player[(7 - jushu) % 4]];
		if (this._hwnd) {
			SendSSTP([this._hwnd, 'open', player[(this._model.qijia + fulou.l) % 4], this.to_ump(fulou.m)]);
		}
	}
    gang(gang)   {
        super.gang(gang);
		const jushu = (4 + this._model.menfeng(this._id) - this._id + this._model.qijia) % 4;
		const player = [this._model.player[(4 - jushu) % 4], this._model.player[(5 - jushu) % 4], this._model.player[(6 - jushu) % 4], this._model.player[(7 - jushu) % 4]];
		if (this._hwnd) {
			if (gang.m.match(/^[mpsz]\d{4}/))
				SendSSTP([this._hwnd, 'open', player[(this._model.qijia + gang.l) % 4], this.to_ump(gang.m)]);
			else
				SendSSTP([this._hwnd, 'open', player[(this._model.qijia + gang.l) % 4], this.to_ump(gang.m.substr(0,2))]);
		}
	}
    kaigang(kaigang) {
        super.kaigang(kaigang);
		if (this._hwnd) {
			SendSSTP([this._hwnd, 'dora', this.to_ump(kaigang.baopai)]);
		}
	}
	hule(hule) {
        super.hule(hule);
		const jushu = (4 + this._model.menfeng(this._id) - this._id + this._model.qijia) % 4;
		const player = [this._model.player[(4 - jushu) % 4], this._model.player[(5 - jushu) % 4], this._model.player[(6 - jushu) % 4], this._model.player[(7 - jushu) % 4]];
		if (this._hwnd) {
			SendSSTP([this._hwnd, 'agari', player[(hule.l + this._model.qijia) % 4], hule.fu]);
			if (hule.fubaopai)
				SendSSTP([this._hwnd, 'dora', this.to_ump(hule.fubaopai.join(''))]);
			for (let i = 0; i < 4; i++) {
				if (!hule.fenpei[i])
					continue;
				SendSSTP([this._hwnd, 'point', player[(i + this._model.qijia) % 4], hule.fenpei[i] > 0 ? '+' : '-', Math.abs(hule.fenpei[i])]);
			}
			SendSSTP([this._hwnd, 'kyokuend']);
		}
	}
	pingju(pingju) {
        super.pingju(pingju);
		const jushu = (4 + this._model.menfeng(this._id) - this._id + this._model.qijia) % 4;
		const player = [this._model.player[(4 - jushu) % 4], this._model.player[(5 - jushu) % 4], this._model.player[(6 - jushu) % 4], this._model.player[(7 - jushu) % 4]];
		if (this._hwnd) {
			SendSSTP([this._hwnd, 'ryukyoku']);
			for (let i = 0; i < 4; i++) {
				if (!pingju.fenpei[i])
					continue;
				SendSSTP([this._hwnd, 'point', player[(i + this._model.qijia) % 4], pingju.fenpei[i] > 0 ? '+' : '-', Math.abs(pingju.fenpei[i])]);
			}
			SendSSTP([this._hwnd, 'kyokuend']);
		}
	}
	jieju(jieju)   {
        super.jieju(jieju);
		const player = this._model.player;
		if (this._hwnd) {
			SendSSTP([this._hwnd, 'gameend', player[0] + String.fromCharCode(1) + jieju.defen[0], player[1] + String.fromCharCode(1) + jieju.defen[1], player[2] + String.fromCharCode(1) + jieju.defen[2], player[3] + String.fromCharCode(1) + jieju.defen[3]]);
		}
	}
}
