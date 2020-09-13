/* (C) 2019-2020 lifegpc
This file is part of bili.

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>. */
window.addEventListener('load', () => {
    /**@typedef {Object} PageData
     * @property {number} page P数
     * @property {string} part 分P名
     * @property {number} cid 视频CID
     * @property {number} duration 分P时长（s）
     * @typedef {Object} NormalVideoData
     * @property {number} aid AV号
     * @property {string} bvid BV号
     * @property {number} ctime 上次修改时间
     * @property {string} desc 视频简介
     * @property {number|undefined} gv graph_version，仅互动视频有
     * @property {string} name UP主名称
     * @property {Array<PageData>} page 每一P的信息
     * @property {string} pic 封面图片地址
     * @property {number} pubdate 视频发布时间
     * @property {string} title 视频标题
     * @property {number} uid UP主ID
     * @property {number} videos 分P数
     * @typedef {Object} errorinfo
     * @property {number} code 错误状态码。
     * @property {string} message 错误信息。
     * @typedef {Object} infodata
     * @property {0|-1} code 状态码。0正常，-1有错误。
     * @property {errorinfo|undefined} re 错误信息。（仅当code为-1时存在）
     * @property {NormalVideoData|undefined} data 视频信息
     * @typedef {Object} ExtractorInfo
     * @property {0|-1|-404|-500} code 状态码。0正常，-1需要登录，-404匹配不到相应的解析器，-500程序错误。
     * @property {string|undefined} e 抛出的错误信息（仅code为-500时存在）
     * @property {string|undefined} type 解析器的类型（仅code为0时存在）
     * @property {string|undefined} url 仅当type为redirect时存在，重定向至的地址
     * @property {number|undefined} vip VIP状态（仅当code为0时并type不为redirect时存在）
     * @property {infodata|undefined} data 数据（仅当code为0时并type不为redirect时存在）
     * @typedef {Object} DurlUrl
     * @property {number} id 视频流画质
     * @property {string} desc 画质描述
     * @property {number} size 流大小（B）
     * @typedef {Object} DashUrl
     * @property {number} id 画/音质ID
     * @property {string|undefined} desc 画质描述
     * @property {string|undefined} codecs 编码信息
     * @property {number|undefined} width 视频宽度
     * @property {number|undefined} height 视频高度
     * @property {string} frame_rate 帧率（B站API返回值，不准确）
     * @property {number} size 流大小
     * @typedef {Object} VideoUrl
     * @property {"dash"|"durl"} type 视频链接格式
     * @property {number} timelength 视频时长（ms）
     * @property {Array<String>} accept_description 所有视频格式描述
     * @property {Array<number>} accept_quality 所有视频格式ID
     * @property {Object.<number,String>} accept_description_dict 以ID为key的视频格式描述
     * @property {Array<number>|null|undefined} accept_audio_quality 音频格式ID（仅dash流类型有。dash流不存在为null）
     * @property {Object.<number,DurlUrl>|{video:Array<DashUrl>,audio:Array<DashUrl>|null}} data 更具体的信息
     * @typedef {Object} VideoUrlRe videoUrl 系列API返回值
     * @property {0|-1|-2|-403|-404|-500|-501} code 返回值，-1 GET请求参数不正确，-2 API调用出错，-403 WEBUI未登录，-404 未匹配到对应的API，-500 内部错误，-501 bili未登录
     * @property {string|undefined} e 错误详细信息，仅code为-500时存在
     * @property {VideoUrl|undefined} data 数据，仅code为0时存在
     * @property {errorinfo|undefined} re 错误信息，仅code为-2时存在
    */
    /**重定向至BiliBili登录页 */
    function biliredir() {
        var uri = new URL(window.location.href);
        var param = {};
        var hl = uri.searchParams.get('hl');
        if (hl != null) param['hl'] = hl;
        param['p'] = window.location.href;
        param = $.param(param);
        window.location.href = '/bililogin?' + param;
    }
    /**@type {ExtractorInfo}*/
    var info = window['info'];
    if (info.code == -1) {
        biliredir();
    }
    var main = document.getElementById('main');
    /**新建一个需要翻译的Label或者其他元素
     * @param {string} s trans字段
     * @param {string} h 元素名称（默认为label）
     * @returns {HTMLLabelElement|HTMLElement}
     */
    function createTransLabel(s, h = "label") {
        var label = document.createElement(h);
        label.className = "trans";
        label.setAttribute('trans', s);
        return label;
    }
    /**创建一个td
     * @param {number|string|HTMLElement|Array<(string|HTMLElement)>} i 要添加的元素或者字符串内容
     * @param {string|Array<String>|DOMTokenList} c class名称
    */
    function createTd(i = null, c = null) {
        var td = document.createElement('td');
        if (i != null) {
            if (i instanceof HTMLElement) {
                td.append(i);
            }
            else if (i instanceof Array) {
                for (var j = 0; j < i.length; j++) {
                    td.append(i[j]);
                }
            }
            else if (i.constructor.name == "String") {
                td.innerText = i;
            }
            else if (i.constructor.name == "Number") {
                td.innerText = i.toString();
            }
        }
        if (c != null) {
            if (c instanceof Array) {
                td.classList.add(c);
            }
            else if (c instanceof DOMTokenList) {
                td.classList = c;
            }
            else if (c.constructor.name == "String") {
                td.classList.add([c]);
            }
        }
        return td
    }
    /**新建一个普通label
     * @param {string|number} s label的内容
     * @returns {HTMLLabelElement}
    */
    function createLabel(s) {
        var label = document.createElement('label');
        label.innerText = s.toString();
        return label;
    }
    function newbr() { return document.createElement('br'); }
    /**格式化时间
     * @param {number} t 时间（秒）
     * @returns {string}
    */
    function formattime(t) {
        return new Date(t * 1000).format("yyyy-MM-dd hh:mm:ss");
    }
    /**将时长转换为字符串格式
     * @param {number} t 时间（秒）
     * @returns {string}
    */
    function durtostr(t) {
        var o = [Math.floor(t / 3600), Math.floor(t % 3600 / 60), t % 60];
        if (o[0] == 0) o.shift();
        var d = [];
        for (var i = 0; i < o.length; i++) {
            var e = o[i];
            d.push(("00" + e).substr(("" + e).length));
        }
        return d.join(':');
    }
    /**根据type创建Download Method选择元素
     * @param {string} t 解析器type
     * @returns {HTMLSelectElement}
    */
    function createsel(t) {
        /**为option元素设置value
         * @param {HTMLOptionElement} h
         * @param {string|number} s
        */
        function setValue(h, s) {
            h.value = s;
            return h;
        }
        if (t == "normal") {
            var sel = document.createElement('select');
            sel.append(setValue(createTransLabel('webui.page DMME1', 'option'), 1));
            sel.append(setValue(createTransLabel('webui.page DMME2', 'option'), 2));
            sel.append(setValue(createTransLabel('webui.page DMME3', 'option'), 3));
            sel.append(setValue(createTransLabel('webui.page DMME4', 'option'), 4));
            sel.append(setValue(createTransLabel('webui.page DMME5', 'option'), 5));
            sel.append(setValue(createTransLabel('webui.page DMME6', 'option'), 6));
            sel.append(setValue(createTransLabel('webui.page DMME8', 'option'), 7));
            return sel
        }
    }
    if (info.code == -500) {
        if (!main.classList.has('e500')) {
            main.classList.add(['e500']);
        }
        main.innerText = info.e;
    }
    else if (info.code == -404) {
        if (!main.classList.has('e404')) {
            main.classList.add(['e404']);
        }
        main.append(createTransLabel('webui.page NOTEXT'));
        transobj.deal();
    }
    else if (info.code == 0) {
        if (info.type == "redirect") {
            var uri = new URL(window.location.href);
            var param = {};
            var hl = uri.searchParams.get('hl');
            if (hl != null) param['hl'] = hl;
            param = $.param(param);
            var url = '/page/' + encodeURIComponent(info.url);
            if (param != "") url += ("?" + param);
            window.location.href = url;
        }
        else {
            var data = info.data;
            if (data.code == -1) {
                var re = data.re;
                if (!main.classList.has('e1')) {
                    main.classList.add(['e1']);
                }
                main.innerText = re.code + " " + re.message;
            }
            else {
                if (info.type == "normal") dealnormalvideo();
            }
        }
    }
    /**@type {HTMLImageElement}*/
    var img;
    /**@type {HTMLDivElement}*/
    var smallinfod1;
    /**@type {HTMLDivElement}*/
    var smallinfod2;
    /**@type {HTMLTableElement}*/
    var table;
    /**@type {HTMLTableRowElement} */
    var head;
    /**@type {HTMLInputElement}*/
    var all_selected;
    /**@type {Array<VideoUrl>} */
    var videourl;
    function dealnormalvideo() {
        var data = info.data.data;
        var videoinfo = document.createElement('div');
        videoinfo.className = "videoinfo";
        main.append(videoinfo);
        var title = document.createElement('h1');
        title.innerText = data.title;
        videoinfo.append(title);
        /**多列布局用*/
        var smallinfo = document.createElement('div');
        smallinfo.className = "flex";
        videoinfo.append(smallinfo);
        smallinfod1 = document.createElement('div');
        smallinfod2 = document.createElement('div');
        var smallinfod3 = document.createElement('div');
        smallinfo.append(smallinfod1);
        smallinfo.append(smallinfod2);
        smallinfo.append(smallinfod3);
        smallinfod1.append(createTransLabel('bili.PrintInfo O1'));//AV号
        smallinfod1.append(createLabel(data.aid));
        smallinfod2.append(createTransLabel('bili.PrintInfo O2'));//BV号
        smallinfod2.append(createLabel(data.bvid));
        img = document.createElement('img');
        var ip = { s: data.pic };
        img.src = "/pic/" + encodeURIComponent(data.title) + "?" + $.param(ip);
        var viewer = new Viewer(img);
        smallinfod3.append(img);
        smallinfod1.append(newbr());
        smallinfod1.append(createTransLabel('bili.PrintInfo O3'));//分P数
        smallinfod1.append(createLabel(data.videos));
        smallinfod2.append(newbr());
        smallinfod2.append(createTransLabel('bili.PrintInfo O5'));//发布时间
        smallinfod2.append(createLabel(formattime(data.pubdate)));
        smallinfod1.append(newbr());
        smallinfod1.append(createTransLabel('bili.PrintInfo O6'));//上次修改时间
        smallinfod1.append(createLabel(formattime(data.ctime)));
        smallinfod2.append(newbr());
        smallinfod2.append(createTransLabel('bili.PrintInfo O24'));//UP主名称
        smallinfod2.append(createLabel(data.name));
        smallinfod1.append(newbr());
        smallinfod1.append(createLabel('UID:'));
        smallinfod1.append(createLabel(data.uid));
        videoinfo.append(createTransLabel('bili.PrintInfo O7'));
        videoinfo.append(createLabel(data.desc));
        var pagelist = document.createElement('div');
        pagelist.className = "pagelist";
        main.append(pagelist);
        table = document.createElement('table');
        pagelist.append(table);
        var thead = document.createElement('thead');
        var tbody = document.createElement('tbody');
        table.append(thead);
        table.append(tbody);
        head = document.createElement('tr');
        thead.append(head);
        /**全部选中复选框*/
        all_selected = document.createElement('input');
        all_selected.type = "checkbox";
        all_selected.className = "allsel";
        all_selected.addEventListener('click', allsel_click);
        head.append(createTd(all_selected));
        head.append(createTd(createTransLabel('webui.page PARTNO')));
        head.append(createTd(createTransLabel('webui.page PARTCID')));
        head.append(createTd(createTransLabel('webui.page PARTNAME')));
        head.append(createTd(createTransLabel('webui.page PARTDUR')));
        head.append(createTd(createTransLabel('webui.page DMME')));
        head.append(createTd(null, "last"));
        for (var i = 0; i < data.page.length; i++) {
            var pd = data.page[i];
            var tr = document.createElement('tr');
            if (i == data.page.length - 1) tr.className = "last";
            var sel = document.createElement('input');
            sel.type = "checkbox";
            sel.className = "sel";
            sel.setAttribute('i', i);
            sel.addEventListener('change', sel_change);
            tr.append(createTd(sel));
            tr.append(createTd(pd.page));
            tr.append(createTd(pd.cid));
            tr.append(createTd(pd.part));
            tr.append(createTd(durtostr(pd.duration)));
            tr.append(createTd(createsel(info.type)));
            tr.append(createTd(null, "last"));
            tbody.append(tr);
        }
        transobj.deal();
    }
    function sel_change() {
        /**@type {HTMLInputElement}*/
        var inp = this;
        var selc = document.getElementsByClassName('sel');
        /**选中数*/
        var sel_n = 0;
        /**未选中数*/
        var nsel_n = 0;
        for (var i = 0; i < selc.length; i++) {
            /**@type {HTMLInputElement}*/
            var t = selc[i];
            if (t.checked) sel_n += 1; else nsel_n += 1;
        }
        if (sel_n > 0 && nsel_n == 0) {
            all_selected.checked = true;
            all_selected.indeterminate = false;
            all_selected.disabled = false;
        }
        else if (nsel_n > 0 && sel_n == 0) {
            all_selected.checked = false;
            all_selected.indeterminate = false;
            all_selected.disabled = false;
        }
        else if (nsel_n > 0 && sel_n > 0) {
            all_selected.checked = false;
            all_selected.indeterminate = true;
            all_selected.disabled = false;
        }
        else {
            all_selected.checked = false;
            all_selected.indeterminate = false;
            all_selected.disabled = true;
        }
    }
    /**@param {MouseEvent} e*/
    function allsel_click(e) {
        e.preventDefault();
        /**@type {HTMLInputElement}*/
        var inp = this;
        setTimeout(() => {//在调用setTimeout之前得到的inp状态是错误的
            /**@type {HTMLCollectionOf<HTMLInputElement>} */
            var selc = document.getElementsByClassName('sel');
            if (!inp.checked) {
                inp.checked = true;
                inp.indeterminate = false;
                for (var i = 0; i < selc.length; i++) {
                    selc[i].checked = true;
                }
            }
            else {
                inp.checked = false;
                inp.indeterminate = false;
                for (var i = 0; i < selc.length; i++) {
                    selc[i].checked = false;
                }
            }
        });
    }
    /**@type {HTMLStyleElement}*/
    var sty = null;
    /**@type {HTMLStyleElement}*/
    var sty2 = null;
    var t_height = document.getElementsByClassName('topmenu first')[0].scrollHeight;
    function mainchange() {
        if (sty == null) {
            sty = document.createElement('style');
            sty2 = document.createElement('style');
            document.head.append(sty);
            document.head.append(sty2);
        }
        if (main == null) {
            main = document.getElementById('main');
            if (main == null) return;
        }
        if (img != null && smallinfod1 != null && smallinfod2 != null) {
            img.style.display = "none";
            var sm_h1 = smallinfod1.scrollHeight;
            var sm_h2 = smallinfod2.scrollHeight;
            img.height = sm_h1 > sm_h2 ? sm_h1 : sm_h2;
            img.style.display = null;
        }
        var w_height = window.innerHeight;
        if (head != null) {
            var mx = document.body.scrollLeft;
            var my = document.body.scrollTop;
            var w_width = window.innerWidth;
            sty2.innerText = "";
            var th_width = head.scrollWidth;
            sty2.innerText = ".pagelist * td.last{display:none;}";
            var th2_width = head.scrollWidth;
            if (th_width < w_width) {
                var wid = w_width - th2_width;
                sty2.innerText = ".pagelist * td.last{width:" + wid + "px;}";
            }
            else sty2.innerText = "";
            document.body.scrollTo(mx, my);
        }
        var m_height = main.scrollHeight;
        if (w_height <= (m_height + t_height)) {
            sty.innerText = "";
        }
        else {
            var top = (w_height - m_height) / 2;
            sty.innerText = "#main{top:" + top + "px;}"
        }
    }
    mainchange();
    var timeout = () => {
        mainchange();
        setTimeout(timeout, 2000);
    }
    setTimeout(timeout, 2000);
    window.addEventListener('resize', mainchange);
})
