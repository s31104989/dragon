import React, { Component } from 'react';
import parse from 'html-react-parser';

/**
 * @see https://note.affi-sapo-sv.com/js-diff.php
 */
const onp = (() => {
    const TEXT_SWAPPED = true;
    const DELETE = 1;
    const INSERT = 2;
    const COMMON = 0;

    const onp = (text1, text2) => {

        const onpFUnc = {
            exec: function (text1, text2) {
                return this.initOnp(text1, text2).onpMain().getSes();
            },
            initOnp: function (text1, text2) {  // 初期化

                const allocBuff = (size, intVal) => (new Int32Array(size)).fill(intVal);

                const [M, N] = [text1.length, text2.length];
                const data = M > N ? { textX: text2, textY: text1, M: N, N: M, swappedFlg: TEXT_SWAPPED }
                    : { textX: text1, textY: text2, M: M, N: N, swappedFlg: !TEXT_SWAPPED };
                const flg = data.swappedFlg ? { ses_insert: DELETE, ses_delete: INSERT, commonType: onp.flg.TEXT2 }
                    : { ses_insert: INSERT, ses_delete: DELETE, commonType: onp.flg.TEXT1 }
                const size = M + N + 3;
                this.onpData = {
                    fp: allocBuff(size, -1),
                    pathRef: allocBuff(size, -1),
                    path: [],
                    offset: data.M + 1,
                    delta: data.N - data.M,
                    data: data,
                    flg: flg
                };
                return this;
            },
            onpMain: function () {

                const { fp, pathRef, path, offset, delta } = this.onpData;
                const { textX, textY, M, N } = this.onpData.data;

                const snake = (k) => {
                    const kOffset = k + offset;
                    const kOffsetMinus = kOffset - 1;
                    const kOffsetPlus = kOffset + 1;

                    const p1 = fp[kOffsetMinus] + 1;
                    const p2 = fp[kOffsetPlus];

                    let [previous, py] = p1 > p2 ? [pathRef[kOffsetMinus], p1]
                        : [pathRef[kOffsetPlus], p2]

                    let px = py - k;
                    const sx = px;

                    while (px < M && py < N && textX[px] === textY[py]) {
                        px++; py++;
                    }

                    if (sx !== px) {
                        pathRef[kOffset] = path.length;
                        path.push({ endX: px - 1, endY: py - 1, length: px - sx, previous: previous });
                    } else {
                        pathRef[kOffset] = previous;
                    }

                    fp[kOffset] = py;
                    return py;
                };

                let k, P;
                for (P = 0; P <= M; P++) {
                    for (k = -P; k < delta; k++) snake(k);
                    for (k = delta + P; k > delta; k--) snake(k);
                    if (snake(delta) === N) break;
                }
                this.onpData.fp = null; // 参照オフ（気休め）
                return this;
            },
            getSes: function () {

                const epcData = [];

                const { pathRef, path, delta, offset } = this.onpData;
                const { M, N } = this.onpData.data;
                const { ses_insert, ses_delete } = this.onpData.flg;
                const ses_common = COMMON;

                let [cX, cY] = [M - 1, N - 1];
                let [sX, sY] = [-1, -1];
                let previous = pathRef[delta + offset];

                while (previous !== -1) {
                    let epc = path[previous];
                    const { endX, endY, length } = epc;
                    [sX, sY] = [endX - length + 1, endY - length + 1];

                    if (cX !== endX) epcData.push({ s: endX + 1, e: cX, flg: ses_delete });
                    if (cY !== endY) epcData.push({ s: endY + 1, e: cY, flg: ses_insert });
                    epcData.push({ s: sX, e: endX, flg: ses_common });

                    [cX, cY, previous] = [sX - 1, sY - 1, epc.previous];
                }
                if (sX !== 0) epcData.push({ s: 0, e: cX, flg: ses_delete });
                if (sY !== 0) epcData.push({ s: 0, e: cY, flg: ses_insert });
                epcData.reverse()

                this.onpData.pathRef = this.onpData.path = null; // 参照オフ（気休め）
                return { commonType: this.onpData.flg.commonType, data: epcData };
            }
        };
        return onpFUnc.exec(text1, text2);
    };
    Object.defineProperty(onp, "flg", {
        writable: false,
        value: Object.freeze({
            TEXT1: DELETE,
            TEXT2: INSERT,
            COMMON: COMMON
        })
    });
    return onp;
})();

class MyDiff extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        let output_html_left = '';
        let output_html_right = '';

        const output_old_escaped = this.props.oldCode.split("");
        const output_new_escaped = this.props.newCode.split("");

        let text1 = '';
        let text2 = '';

        output_old_escaped.forEach(element => {
            if (element === '<') {
                text1 += '&lt;';
            } else if (element === '>') {
                text1 += '&gt';
            } else if (element === '"') {
                text1 += '&quot;';
            } else {
                text1 += element;
            }
        });

        output_new_escaped.forEach(element => {
            if (element === '<') {
                text2 += '&lt;';
            } else if (element === '>') {
                text2 += '&gt';
            } else if (element === '"') {
                text2 += '&quot;';
            } else {
                text2 += element;
            }
        });


        const result = onp(text1, text2);
        const commonText = result.commonType === onp.flg.TEXT2 ? text2 : text1;

        result.data.forEach(e => {
            switch (e.flg) {
                case onp.flg.TEXT2:
                    // console.log( "+" + text2.substring(e.s,e.e+1) );
                    output_html_right += ('<span class="green">' + text2.substring(e.s, e.e + 1) + '</span>');
                    return;
                case onp.flg.TEXT1:
                    // console.log( "-" + text1.substring(e.s,e.e+1) );
                    output_html_left += ('<span class="red">' + text1.substring(e.s, e.e + 1) + '</span>');
                    return
                case onp.flg.COMMON:
                    // console.log( " " + commonText.substring(e.s,e.e+1) );
                    output_html_left += commonText.substring(e.s, e.e + 1);
                    output_html_right += commonText.substring(e.s, e.e + 1);
                    break;
            }
        });
        return (
            <div className='container'>
                <div className='leftSide'>
                    <div className='header'>Old Text</div>
                    <pre className='leftCode'>{parse(output_html_left)}</pre>
                </div>
                <div className='rightSide'>
                    <div className='header'>New Text</div>
                    <pre className='rightCode'>{parse(output_html_right)}</pre>
                </div>
            </div>

        );
    }
}

export default MyDiff;
