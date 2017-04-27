/**
 * Created by kin on 2017/4/27.
 *
 * josn导出excel
 * mail：cuikangjie_90h@126.com
 */
(function() {
    'use static'

    function eje(option) {
        this.fileName = option.fileName || 'download';
        this.datas = option.datas;
        this.workbook = {
            SheetNames: [],
            Sheets: {}
        };
    }

    eje.prototype.instance = function() {
        var _this = this,
            wb = _this.workbook;

        // if (!XLSX) {
        //     console.log('请引入dist目录下JsonExportExcel.min,js');
        //     return;
        // }

        _this.datas.forEach(function(data, index) {
            var sheetHeader = data.sheetHeader || null;
            var sheetData = data.sheetData;
            var sheetName = data.sheetName || 'sheet' + (index + 1);
            var sheetFilter = data.sheetFilter || null;

            var data = _this.changeData(sheetData, sheetFilter);

            if (sheetHeader) {
                data.unshift(sheetHeader)
            }

            var ws = _this.sheet_from_array_of_arrays(data);

            ws['!merges'] = [];

            wb.SheetNames.push(sheetName);
            wb.Sheets[sheetName] = ws;
        });

        var wbout = XLSX.write(wb, {
            bookType: 'xlsx',
            bookSST: false,
            type: 'binary'
        });
        _this.saveAs(new Blob([_this.s2ab(wbout)], {
            type: "application/octet-stream"
        }), _this.fileName + ".xlsx")
    }
    // 过滤
    eje.prototype.changeData = function(data, filter) {
        var data = data,
            filter = filter,
            re = [];
        typeof data[0][0] == 'undefined' ? (function() {
            //对象
            filter ? (function() {
                //存在过滤
                data.forEach(function(obj) {
                    var one = [];
                    filter.forEach(function(no) {
                        one.push(obj[no]);
                    });
                    re.push(one);
                });
            })() : (function() {
                //不存在过滤
                data.forEach(function(obj) {
                    var col = Object.keys(obj);
                    var one = [];
                    col.forEach(function(no) {
                        one.push(obj[no]);
                    });
                    re.push(one);
                });

            })();
        })() : (function() {
            re = data;
        })();
        return re;
    }

    // 转换数据
    eje.prototype.sheet_from_array_of_arrays = function(data) {
        var _this = this;
        var ws = {};
        var range = {
            s: {
                c: 10000000,
                r: 10000000
            },
            e: {
                c: 0,
                r: 0
            }
        };
        for (var R = 0; R != data.length; ++R) {
            for (var C = 0; C != data[R].length; ++C) {
                if (range.s.r > R) range.s.r = R;
                if (range.s.c > C) range.s.c = C;
                if (range.e.r < R) range.e.r = R;
                if (range.e.c < C) range.e.c = C;
                var cell = {
                    v: data[R][C]
                };
                if (cell.v == null) continue;
                var cell_ref = XLSX.utils.encode_cell({
                    c: C,
                    r: R
                });

                if (typeof cell.v === 'number') cell.t = 'n';
                else if (typeof cell.v === 'boolean') cell.t = 'b';
                else if (cell.v instanceof Date) {
                    cell.t = 'n';
                    cell.z = XLSX.SSF._table[14];
                    cell.v = _this.datenum(cell.v);
                } else cell.t = 's';
                ws[cell_ref] = cell;
            }
        }
        if (range.s.c < 10000000) ws['!ref'] = XLSX.utils.encode_range(range);
        return ws;
    }


    eje.prototype.s2ab = function(s) {
        var buf = new ArrayBuffer(s.length);
        var view = new Uint8Array(buf);
        for (var i = 0; i != s.length; ++i) view[i] = s.charCodeAt(i) & 0xFF;
        return buf;
    };
    eje.prototype.datenum = function(v, date1904) {
        if (date1904) v += 1462;
        var epoch = Date.parse(v);
        return (epoch - new Date(Date.UTC(1899, 11, 30))) / (24 * 60 * 60 * 1000);
    };


    eje.prototype.saveExcel = function() {

        this.instance();
    };

    // saveAs 不支持ie10以下
    eje.prototype.saveAs =(function(view) {
        "use strict";
        // IE <10 is explicitly unsupported
        if (typeof view === "undefined" || typeof navigator !== "undefined" && /MSIE [1-9]\./.test(navigator.userAgent)) {
            return;
        }
        var
            doc = view.document
            // only get URL when necessary in case Blob.js hasn't overridden it yet
            ,
            get_URL = function() {
                return view.URL || view.webkitURL || view;
            },
            save_link = doc.createElementNS("http://www.w3.org/1999/xhtml", "a"),
            can_use_save_link = "download" in save_link,
            click = function(node) {
                var event = new MouseEvent("click");
                node.dispatchEvent(event);
            },
            is_safari = /constructor/i.test(view.HTMLElement) || view.safari,
            is_chrome_ios = /CriOS\/[\d]+/.test(navigator.userAgent),
            throw_outside = function(ex) {
                (view.setImmediate || view.setTimeout)(function() {
                    throw ex;
                }, 0);
            },
            force_saveable_type = "application/octet-stream"
            // the Blob API is fundamentally broken as there is no "downloadfinished" event to subscribe to
            ,
            arbitrary_revoke_timeout = 1000 * 40 // in ms
            ,
            revoke = function(file) {
                var revoker = function() {
                    if (typeof file === "string") { // file is an object URL
                        get_URL().revokeObjectURL(file);
                    } else { // file is a File
                        file.remove();
                    }
                };
                setTimeout(revoker, arbitrary_revoke_timeout);
            },
            dispatch = function(filesaver, event_types, event) {
                event_types = [].concat(event_types);
                var i = event_types.length;
                while (i--) {
                    var listener = filesaver["on" + event_types[i]];
                    if (typeof listener === "function") {
                        try {
                            listener.call(filesaver, event || filesaver);
                        } catch (ex) {
                            throw_outside(ex);
                        }
                    }
                }
            },
            auto_bom = function(blob) {
                // prepend BOM for UTF-8 XML and text/* types (including HTML)
                // note: your browser will automatically convert UTF-16 U+FEFF to EF BB BF
                if (/^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(blob.type)) {
                    return new Blob([String.fromCharCode(0xFEFF), blob], {
                        type: blob.type
                    });
                }
                return blob;
            },
            FileSaver = function(blob, name, no_auto_bom) {
                if (!no_auto_bom) {
                    blob = auto_bom(blob);
                }
                // First try a.download, then web filesystem, then object URLs
                var
                    filesaver = this,
                    type = blob.type,
                    force = type === force_saveable_type,
                    object_url, dispatch_all = function() {
                        dispatch(filesaver, "writestart progress write writeend".split(" "));
                    }
                    // on any filesys errors revert to saving with object URLs
                    ,
                    fs_error = function() {
                        if ((is_chrome_ios || (force && is_safari)) && view.FileReader) {
                            // Safari doesn't allow downloading of blob urls
                            var reader = new FileReader();
                            reader.onloadend = function() {
                                var url = is_chrome_ios ? reader.result : reader.result.replace(/^data:[^;]*;/, 'data:attachment/file;');
                                var popup = view.open(url, '_blank');
                                if (!popup) view.location.href = url;
                                url = undefined; // release reference before dispatching
                                filesaver.readyState = filesaver.DONE;
                                dispatch_all();
                            };
                            reader.readAsDataURL(blob);
                            filesaver.readyState = filesaver.INIT;
                            return;
                        }
                        // don't create more object URLs than needed
                        if (!object_url) {
                            object_url = get_URL().createObjectURL(blob);
                        }
                        if (force) {
                            view.location.href = object_url;
                        } else {
                            var opened = view.open(object_url, "_blank");
                            if (!opened) {
                                // Apple does not allow window.open, see https://developer.apple.com/library/safari/documentation/Tools/Conceptual/SafariExtensionGuide/WorkingwithWindowsandTabs/WorkingwithWindowsandTabs.html
                                view.location.href = object_url;
                            }
                        }
                        filesaver.readyState = filesaver.DONE;
                        dispatch_all();
                        revoke(object_url);
                    };
                filesaver.readyState = filesaver.INIT;

                if (can_use_save_link) {
                    object_url = get_URL().createObjectURL(blob);
                    setTimeout(function() {
                        save_link.href = object_url;
                        save_link.download = name;
                        click(save_link);
                        dispatch_all();
                        revoke(object_url);
                        filesaver.readyState = filesaver.DONE;
                    });
                    return;
                }

                fs_error();
            },
            FS_proto = FileSaver.prototype,
            saveAs = function(blob, name, no_auto_bom) {
                return new FileSaver(blob, name || blob.name || "download", no_auto_bom);
            };
        // IE 10+ (native saveAs)
        if (typeof navigator !== "undefined" && navigator.msSaveOrOpenBlob) {
            return function(blob, name, no_auto_bom) {
                name = name || blob.name || "download";

                if (!no_auto_bom) {
                    blob = auto_bom(blob);
                }
                return navigator.msSaveOrOpenBlob(blob, name);
            };
        }

        FS_proto.abort = function() {};
        FS_proto.readyState = FS_proto.INIT = 0;
        FS_proto.WRITING = 1;
        FS_proto.DONE = 2;

        FS_proto.error =
            FS_proto.onwritestart =
            FS_proto.onprogress =
            FS_proto.onwrite =
            FS_proto.onabort =
            FS_proto.onerror =
            FS_proto.onwriteend =
            null;

        return saveAs;
    }(
        typeof self !== "undefined" && self ||
        typeof window !== "undefined" && window ||
        this.content
    ));

    window.ExportJsonExcel = eje;
})();

// Blob支持
(function(view) {
    "use strict";

    view.URL = view.URL || view.webkitURL;

    if (view.Blob && view.URL) {
        try {
            new Blob;
            return;
        } catch (e) {}
    }

    // Internally we use a BlobBuilder implementation to base Blob off of
    // in order to support older browsers that only have BlobBuilder
    var BlobBuilder = view.BlobBuilder || view.WebKitBlobBuilder || view.MozBlobBuilder || (function(view) {
        var
            get_class = function(object) {
                return Object.prototype.toString.call(object).match(/^\[object\s(.*)\]$/)[1];
            },
            FakeBlobBuilder = function BlobBuilder() {
                this.data = [];
            },
            FakeBlob = function Blob(data, type, encoding) {
                this.data = data;
                this.size = data.length;
                this.type = type;
                this.encoding = encoding;
            },
            FBB_proto = FakeBlobBuilder.prototype,
            FB_proto = FakeBlob.prototype,
            FileReaderSync = view.FileReaderSync,
            FileException = function(type) {
                this.code = this[this.name = type];
            },
            file_ex_codes = (
                "NOT_FOUND_ERR SECURITY_ERR ABORT_ERR NOT_READABLE_ERR ENCODING_ERR " +
                "NO_MODIFICATION_ALLOWED_ERR INVALID_STATE_ERR SYNTAX_ERR"
            ).split(" "),
            file_ex_code = file_ex_codes.length,
            real_URL = view.URL || view.webkitURL || view,
            real_create_object_URL = real_URL.createObjectURL,
            real_revoke_object_URL = real_URL.revokeObjectURL,
            URL = real_URL,
            btoa = view.btoa,
            atob = view.atob

            ,
            ArrayBuffer = view.ArrayBuffer,
            Uint8Array = view.Uint8Array

            ,
            origin = /^[\w-]+:\/*\[?[\w\.:-]+\]?(?::[0-9]+)?/;
        FakeBlob.fake = FB_proto.fake = true;
        while (file_ex_code--) {
            FileException.prototype[file_ex_codes[file_ex_code]] = file_ex_code + 1;
        }
        // Polyfill URL
        if (!real_URL.createObjectURL) {
            URL = view.URL = function(uri) {
                var
                    uri_info = document.createElementNS("http://www.w3.org/1999/xhtml", "a"),
                    uri_origin;
                uri_info.href = uri;
                if (!("origin" in uri_info)) {
                    if (uri_info.protocol.toLowerCase() === "data:") {
                        uri_info.origin = null;
                    } else {
                        uri_origin = uri.match(origin);
                        uri_info.origin = uri_origin && uri_origin[1];
                    }
                }
                return uri_info;
            };
        }
        URL.createObjectURL = function(blob) {
            var
                type = blob.type,
                data_URI_header;
            if (type === null) {
                type = "application/octet-stream";
            }
            if (blob instanceof FakeBlob) {
                data_URI_header = "data:" + type;
                if (blob.encoding === "base64") {
                    return data_URI_header + ";base64," + blob.data;
                } else if (blob.encoding === "URI") {
                    return data_URI_header + "," + decodeURIComponent(blob.data);
                }
                if (btoa) {
                    return data_URI_header + ";base64," + btoa(blob.data);
                } else {
                    return data_URI_header + "," + encodeURIComponent(blob.data);
                }
            } else if (real_create_object_URL) {
                return real_create_object_URL.call(real_URL, blob);
            }
        };
        URL.revokeObjectURL = function(object_URL) {
            if (object_URL.substring(0, 5) !== "data:" && real_revoke_object_URL) {
                real_revoke_object_URL.call(real_URL, object_URL);
            }
        };
        FBB_proto.append = function(data /*, endings*/ ) {
            var bb = this.data;
            // decode data to a binary string
            if (Uint8Array && (data instanceof ArrayBuffer || data instanceof Uint8Array)) {
                var
                    str = "",
                    buf = new Uint8Array(data),
                    i = 0,
                    buf_len = buf.length;
                for (; i < buf_len; i++) {
                    str += String.fromCharCode(buf[i]);
                }
                bb.push(str);
            } else if (get_class(data) === "Blob" || get_class(data) === "File") {
                if (FileReaderSync) {
                    var fr = new FileReaderSync;
                    bb.push(fr.readAsBinaryString(data));
                } else {
                    // async FileReader won't work as BlobBuilder is sync
                    throw new FileException("NOT_READABLE_ERR");
                }
            } else if (data instanceof FakeBlob) {
                if (data.encoding === "base64" && atob) {
                    bb.push(atob(data.data));
                } else if (data.encoding === "URI") {
                    bb.push(decodeURIComponent(data.data));
                } else if (data.encoding === "raw") {
                    bb.push(data.data);
                }
            } else {
                if (typeof data !== "string") {
                    data += ""; // convert unsupported types to strings
                }
                // decode UTF-16 to binary string
                bb.push(unescape(encodeURIComponent(data)));
            }
        };
        FBB_proto.getBlob = function(type) {
            if (!arguments.length) {
                type = null;
            }
            return new FakeBlob(this.data.join(""), type, "raw");
        };
        FBB_proto.toString = function() {
            return "[object BlobBuilder]";
        };
        FB_proto.slice = function(start, end, type) {
            var args = arguments.length;
            if (args < 3) {
                type = null;
            }
            return new FakeBlob(
                this.data.slice(start, args > 1 ? end : this.data.length), type, this.encoding
            );
        };
        FB_proto.toString = function() {
            return "[object Blob]";
        };
        FB_proto.close = function() {
            this.size = 0;
            delete this.data;
        };
        return FakeBlobBuilder;
    }(view));

    view.Blob = function(blobParts, options) {
        var type = options ? (options.type || "") : "";
        var builder = new BlobBuilder();
        if (blobParts) {
            for (var i = 0, len = blobParts.length; i < len; i++) {
                if (Uint8Array && blobParts[i] instanceof Uint8Array) {
                    builder.append(blobParts[i].buffer);
                } else {
                    builder.append(blobParts[i]);
                }
            }
        }
        var blob = builder.getBlob(type);
        if (!blob.slice && blob.webkitSlice) {
            blob.slice = blob.webkitSlice;
        }
        return blob;
    };

    var getPrototypeOf = Object.getPrototypeOf || function(object) {
        return object.__proto__;
    };
    view.Blob.prototype = getPrototypeOf(new view.Blob());
}(typeof self !== "undefined" && self || typeof window !== "undefined" && window || this.content || this));
