
var globalMessageInterval;
var firstMessage = true;

var green_arrow_small;
var green_arrow_big;
var logo_animate_run = true;

$(document).ready(function() {
    $(".youtube").youtube();
    $(".youtube").fancybox({
        openEffect  : 'none',
        closeEffect : 'none',
        nextEffect  : 'none',
        prevEffect  : 'none',
        padding     : 0,
        margin      : [20, 60, 20, 60] // Increase left/right margin
    });
    init_progress_bar_resize($('body'));

    $('.navbar .navbar-search .add-on').click(function(){
        $(this).siblings('input').val('')
    })

    $('.navbar .navbar-search input').typeahead({
        source: function (term, query) {
            autoCompl = []
            // see web.py for the mediatypenames and 'All' handling
            // see base.html for the js var mediaTypenames
            $.each(mediaTypenames, function(index, item){
                autoCompl.push(item + ': ' + term);
            });
            // searching for all creates locked databases because of the two threads
            // disableling that for now
            // autoCompl.push('All: ' + term);
            return autoCompl;
        },
        sorter: function (items) {
            return items;
        },
        highlighter: function (item) {
            var regex = new RegExp( ': (' + this.query + ')', 'gi' );
            previously_on_xdm(this.query);
            return item.replace( regex, ": <strong>$1</strong>" );
        },
        //http://stackoverflow.com/questions/9425024/submit-selection-on-bootstrap-typeahead-autocomplete
        updater : function(item) {
            this.$element[0].value = item;
            this.$element[0].form.submit();
            return item;
        }
    }).on("keydown", function(e){
        // up and down and esc
        if(e.keyCode == 40 || e.keyCode == 38 || e.keyCode == 27){
            previously_on_xdm();
        }
    });
    $('.navbar .navbar-search ').on('change', function (e, value) {
        if(typeof(value) == "undefined"){
            $(".navbar .navbar-search .typeahead *").qtip('destroy', true);
        }
    });
    $('.navbar .dropdown-toggle').dropdown()

    
    $('.notifications .dropdown-menu').click(function (e) {
        e.stopPropagation();
    });

    // TODO: make it stop on hover
    var news = $("#newsFeed .news");
    var newsIndex = -1;
    function showNextNews() {
        ++newsIndex;
        news.eq(newsIndex % news.length)
            .fadeIn(1000)
            .delay(5000)
            .fadeOut(1000, showNextNews);
    }
    if(news.length){
        showNextNews();
    }

    var logo = Snap.select("#xdm-logo");
    green_arrow_small = logo.select("#plugin1");
    green_arrow_big = logo.select("#plugin2");
    $(document).ajaxComplete(function(){
        logo_animate_run = false;
    });
    $(document).ajaxStart(function(event){
        if(!logo_animate_run){
            logo_animate_run = true;
            animate_logo();
        }
    });
});

function animate_logo(){
    if(!logo_animate_run){
        console.log("told to stop logo animation");
        return
    }
    console.log("staring logo animation");
    green_arrow_big.animate({ 
        transform: "t0,9",
        opacity: 0
    }, 500, mina.easeout, function(){
        // now the small arrow
        green_arrow_small.animate({ 
            transform: "t0,18",
            opacity: 0
        }, 500, mina.easeout, function(){
            green_arrow_big.transform("t0,0");
            green_arrow_big.animate({
                opacity: 1
            }, 500, mina.easeout, function(){
                green_arrow_small.transform("t0,0");
                green_arrow_small.animate({
                    opacity: 1
                }, 500, mina.easeout, animate_logo);
                
            });
        });
    });
}

function previously_on_xdm(query){
    var active_item = $('.navbar .navbar-search .typeahead li.active');
    mt = active_item.text().split(":")[0]
    if(typeof(query) == "undefined")
        query = active_item.text().split(":")[1]
    data = {term: query, mt: mt};
    $("*", active_item.parent()).qtip('destroy', true);

    $.getJSON(webRoot+'/ajax/preview', data, function(res){
        if(res["result"]){
            $('.navbar .navbar-search .typeahead li.active').qtip({
                content: {
                    text: function(){
                        var table = $("<table>");
                        $.each(res["data"], function(index, item){
                            var tr = $("<tr>");
                            var td = $("<td>");
                            var div = $("<div>");
                            var span = $("<span>").text(item["name"]);
                            var status = $("<small>").text(item["status"]).addClass("muted");
                            div.append(span).append("<br/>").append(status);
                            td.append(div);
                            var img_td = $("<td>")
                            console.log(item["img"]);
                            if(item["img"])
                                img_td.append($("<img>").attr("src", item["img"]).addClass("round-corners"));
                            tr.append(img_td).append(td);
                            table.append(tr)
                        });
                        return table;
                    },
                    title: "Already on XDM"
                },
                style:{
                    classes: 'qtip-bootstrap search-preview'
                },
                show: {
                    solo: true,
                    ready: true,
                },
                hide: {
                    event: "all"
                },
                position: {
                    viewport: $("body"),
                    my: 'right center',
                    at: 'center left',
                    adjust: {
                        method: 'none shift'
                    }
                }
            });
        }
    });
}


function init_progress_bar_resize(parent){
    $('.progress .bar', parent).resize(function(event){
        var p = $(this).parent();
        var ph = p.height();
        var w = $('.bar', p).width();
        var w = 0;
        $('.bar', p).each(function() {
            w += $(this).width();
        });
        $('span.progressbar-front-text', p).css("clip", "rect(0px, "+w+"px, "+ph+"px, 0px)")
        $('span', p).css('line-height', ph+'px')
    });
    $('.progress .bar', parent).resize()
}



function closeAllMessages(){
    $('.notifications .open').removeClass('open')
    $('tr.message .close').each(function(index, item){
        $(item).click()
    });
}

function messageClose(uuid){
    var messageTr = $('tr.message[data-uuid="'+uuid+'"]')
    data = {}
    data['uuid'] = uuid;
    $.getJSON(webRoot+'/ajax/messageClose', data, function(res){
        if(res['result']){
            messageTr.hide('fast')
            newCount = parseInt($('.notifications .count').text()) - 1;
            $('.notifications .count').text(newCount)
            if(!newCount){
                $('.notifications .count').removeClass('badge-info')
                $('.notifications .table').remove()
                $('.notifications .open').removeClass('open')
            }
        }
    })
}

function messageConfirm(uuid){
    var messageTr = $('tr.message[data-uuid="'+uuid+'"]')
    $('.confirm', messageTr).addClass('btn-striped animate');
    
    data = {}
    data['uuid'] = uuid;
    $.getJSON(webRoot+'/ajax/messageConfirm', data, function(res){
        if(res['result']){
            messageTr.hide('fast')
            newCount = parseInt($('.notifications .count').text()) - 1;
            $('.notifications .count').text(newCount)
            if(!newCount){
                $('.notifications .count').removeClass('badge-info')
                $('.notifications .table').remove()
                $('.notifications .open').removeClass('open')
            }
        }else{
            $('.confirm', messageTr).removeClass('animate').addClass('btn-danger');
        }
    })
}

function ajaxSetElementStatus(sender, status_id, element_id, silent){
    console.log("sender", sender);
    if(typeof silent == 'undefined')
        silent = false;
    data = {};
    data['status_id'] = status_id;
    data['element_id'] = element_id;
    $.getJSON(webRoot+'/ajax/setStatus', data, function(res){
        if(res['result']){
            if(!silent)
                noty({text: res['msg'], type: 'success', timeout:2000});
            setStatusText(element_id, res['data']['status_id']);
        }
    })
};

function ajaxDeleteElement(id, deleteNode){
    data = {};
    data['id'] = id;
    $.getJSON(webRoot+'/ajax/deleteElement', data, function(res){
        if(res['result']){
            deleteNode.hide('slow')
            noty({text: res['msg'], type: 'success', timeout:2000})
        }
    })
};

function addElement(sender, id){
    $(sender).addClass('btn-striped animate');
    data = {};
    data['id'] = id;
    $.getJSON(webRoot+'/ajax/addElement', data, function(res){
        if(res['result']){
            $(sender).closest('.status-temp').hide('slow')
            $(sender).removeClass('btn-striped animate');
            noty({text: res['msg'], type: 'success', timeout:2000})
        }
    })
};

function ajaxGetDownload(sender, id){
    $(sender).addClass('btn-striped animate');
    data = {};
    data['id'] = id;
    $.getJSON(webRoot+'/ajax/getDownload', data, function(res){
        $(sender).removeClass('btn-striped animate');
        if(res['result']){
            noty({text: res['msg'], type: 'success', timeout:2000});
            setStatusText(res["data"]["element_id"], res["data"]["status_id"]);
        }else{
            noty({text: res['msg'], type: 'error', timeout:2000});
        }
    })
};

function setStatusText(element_id, status_id){
    $("[data-id="+element_id+"] .status-select .dropdown-toggle .text")
    .text(status_by_id[status_id]["screenName"]);
}


function ajaxForceSearch(sender, element_id){
    $(sender).addClass('btn-striped animate');
    data = {};
    data['id'] = element_id;
    $.getJSON(webRoot+'/ajax/forceSearch', data, function(res){
        $(sender).removeClass('btn-striped animate');
        if(res['result']){
            noty({text: res['msg'], type: 'success', timeout:2000});
        }else{
            noty({text: res['msg'], type: 'error', timeout:2000});
        }
        setStatusText(element_id, res['data']['status_id']);
    })
};

function createModal(name){
    var id = makeSafeForCSS(name+'Frame');
    var modalFrame = $('#'+id);
    
    modalFrame.remove()
    $('body>.modal').remove()
    // set up the bootstrap dialog
    modalFrame = $('<div id="'+id+'" class="modal hide fade modal-wide"><div class="modal-header"><button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button><h3>'+name+'</h3></div><div class="modal-body"></div></div>').appendTo('body')
    modalFrame.append('<div class="modal-footer"><button class="btn" data-dismiss="modal">Close</button></div>')
    
    var otherOpenModals = $('body>div.modal:not([style="display: none;"]):not(#'+id+')').modal('hide')
    console.log(otherOpenModals)
    $('body').append(modalFrame)
    if(otherOpenModals.length){
        $('[data-dismiss="modal"]', modalFrame).click(function(e){
            otherOpenModals.modal('show')
        });
        $('.modal-footer button:first',modalFrame).text('Back')
    }
    return modalFrame
}

function ajaxModal(sender, name, url, data){
    $(sender).addClass('btn-striped animate');
    var myModal = createModal(name)
    $.post(url, data, function(res){
        $('.modal-body', myModal).html(res)
        myModal.modal();
        $(sender).removeClass('btn-striped animate');
    });
    return myModal;
}


function showEvents(sender, id){
    data = {'id': id}
    name = 'Events'
    var myModal = ajaxModal(sender, name, webRoot+'/ajax/getEventsFrame', data)
    // check for events
    if(!$('.modal-body tr:not(.notice)', myModal).length)
        $('.modal-footer', myModal).append('<input class="btn btn-warning" value="Clear Events" type="submit"></div>')
    //hook up the clear event button
    $('input[type="submit"]', myModal).click(function(e){
        var t = $(this);
        t.addClass('btn-striped animate')
        $.getJSON(webRoot+'/ajax/clearEvents', data, function(res){
            if(res['result']){
                noty({text: res['msg'], type: 'success', timeout: 1000})
                $('.modal-body', myModal).html('<h4>No events yet.</h4>')
            }else{
                noty({text: res['msg'], type: 'error'})  
                saveButtons.addClass('btn-warning')
            }
            t.removeClass('btn-striped animate')
        }).error(function(){
            noty({text: 'Server error. Is it running? Check logs', type: 'error'}) 
            t.removeClass('animate')
        })
    })
}

function showDownlads(sender, id){
    data = {'id': id}
    name = 'Downloads'
    ajaxModal(sender, name, webRoot+'/ajax/getDownloadsFrame', data)
}

function showConfigs(sender, id){
    data = {'id': id}
    name = 'Configuration'
    var myModal = ajaxModal(sender, name, webRoot+'/ajax/getConfigFrame', data);
    console.log("the modal", myModal);
    myModal.on('shown', function() {
        if(!myModal.hasClass("activated")){
            //console.log('myModal', myModal);
            //console.log('tab as', $('.nav-tabs a[data-toggle="tab"]:first'));
            //console.log($('.nav-tabs a[data-toggle="tab"]:first', myModal));
            $('.nav-tabs a[data-toggle="tab"]:first', myModal).tab('show');
            $('.modal-footer', myModal).append('<input class="btn btn-success" value="Save" type="submit"></div>');
            formAjaxSaveConnect($('input[type="submit"]', myModal), $('#config-'+id));
            init_settings();
        }
        myModal.addClass("activated");
    })

}

function labelInputConnector(labels){
    labels.each(function(){
        var curLabel = $(this);
        var curInput = $('input[type!="hidden"]', curLabel.parent());
        // check for the for attr to not beeing invasive
        if(typeof(curLabel.attr('for')) == "undefined" && curInput.length){
            var id = curInput.attr('id');
            if(!id){
                // remove "0." from the random to get ids without a dot
                id = $.now()+((''+Math.random()).split('.')[1]);
                curInput.attr('id',id);
            }
            curLabel.attr('for',id);
        }
    });
}


function formAjaxSaveConnect(saveButtons, theForm){
    saveButtons.click(function(event){
        console.log(this)
        if($(this).hasClass('animate')){
            event.preventDefault();
            return false;
        }else if($(this).hasClass('btn-warning')){
            return true;
        }
        event.preventDefault();
        
        saveButtons.addClass('btn-striped animate')
        data = theForm.serialize()
        

        $.getJSON(webRoot+'/ajax/save', data, function(res){
            if(res['result']){
                $(this).button('loading');
                noty({text: res['msg'], type: 'success', timeout: 1000})
            }else{
                noty({text: res['msg'], type: 'error'})  
                saveButtons.addClass('btn-warning')
            }
            saveButtons.removeClass('btn-striped animate')
        }).error(function(){
            noty({text: 'Server error. Is it running? Check logs', type: 'error'}) 
            saveButtons.removeClass('animate btn-success').addClass('btn-warning')
        })
    });
}

function hasOwnProperty(obj, prop) {
    var proto = obj.__proto__ || obj.constructor.prototype;
    return (prop in obj) &&
        (!(prop in proto) || proto[prop] !== obj[prop]);
}

//http://stackoverflow.com/questions/7627000/javascript-convert-string-to-safe-class-name-for-css
function makeSafeForCSS(name) {
    return name.replace(/[^a-z0-9]/g, function(s) {
        var c = s.charCodeAt(0);
        if (c == 32) return '-';
        if (c >= 65 && c <= 90) return '_' + s.toLowerCase();
        return '__' + ('000' + c.toString(16)).slice(-4);
    });
}


function pluginAjaxCall(self, p_type, p_instance, id, action){
    if($(self).hasClass('animate'))
        return

    $(self).addClass('btn-striped animate')
    var data = {'p_type': p_type, 'p_instance': p_instance, 'action': action};
    $('input, select', '#'+id).each(function(k,i){
        if(typeof $(i).data('configname') !== "undefined"){
            var val = $(i).val()
            if($(i).attr('type') == 'checkbox'){
                if($(i).prop('checked')){
                    val = ['on', 'off'];
                }else{
                    val = 'off';
                }
            }
            data['field_'+$(i).data('configname')] = val;
        }
            
    });
    $.getJSON(webRoot+'/ajax/pluginCall', data, function(res){
        if(res['result']){
            noty({text: p_type+'('+p_instance+') - '+$(self).val()+': '+res['msg'], type: 'success', timeout: 2000})
            
            var data = res['data']
            if(hasOwnProperty(data, 'callFunction')){
                var fn = window[data['callFunction']];
                fn(data['functionData']);
            }
        }else
            noty({text: p_type+'('+p_instance+') - '+$(self).val()+': '+res['msg'], type: 'error'})    
        $(self).removeClass('btn-striped animate')
    });
}


function rebootModal(button){
    bootbox.confirm("Are you sure you want to reboot XDM?", function(result) {
        if(result)
            rebootModalExecute(button)
      }); 
}

function rebootModalExecute(button){
    data = {}
    name = 'Rebooting'
    var frame = ajaxModal(button, name, webRoot+'/ajax/reboot', data)
    
    firstMessage = true;        
    window.setInterval(function(){messageScrobbler('getSystemMessage', true)}, 500);
    $('.modal-body', frame).css('padding', 0)
    $('.modal-header .close').remove()
    $('.modal-footer button').hide()
    $('.modal-backdrop').click(function(e){
        e.preventDefautl()
        return false;
    })
    return false;
}


function shutdownModal(button){
    bootbox.confirm("Are you sure you want to shutdown XDM?", function(result) {
        if(result)
            shutdownModalExecute(button)
      }); 
}
function shutdownModalExecute(button){
    data = {}
    name = 'Shutdown'
    var frame = ajaxModal(button, name, webRoot+'/ajax/shutdown', data)
    
    firstMessage = true;
    var finalMessageString = "Connection lost. Looks like it's Done!<br/>Thank you for using <pre>"+getAsciiArtLogo()+"</pre>"
    
    globalMessageInterval = window.setInterval(function(){messageScrobbler('getSystemMessage', true, 'info', finalMessageString)}, 500);
    $('.modal-body', frame).css('padding', 0)
    $('.modal-header .close').remove()
    $('.modal-footer button').hide()
    $('.modal-backdrop').click(function(e){
        e.preventDefautl()
        return false;
    })
    return false;
}

function installModalFromMessage(button, identifier){
    $(button).attr('data-identifier', identifier)
    installModal(button)
    $('.close', $(button).parent()).click()
}

function installModal(button){
    var id = $(button).data('identifier');
    data = {'identifier': id}
    name = 'Installing '+id
    var frame = ajaxModal(button, name, webRoot+'/ajax/installPlugin', data)
    
    firstMessage = true;        
    window.setTimeout(function(){messageScrobbler('getRepoMessage')}, 500);
    $('.modal-body', frame).css('padding', 0)
    $('.modal-header .close').remove()
    return false;
}

function modalCoreUpdate(button){
    name = "Updating XDM"
    var frame = ajaxModal(button, name, webRoot+'/ajax/coreUpdate', {})
    
    firstMessage = true;        
    window.setInterval(function(){messageScrobbler('getSystemMessage', true)}, 500);
    $('.modal-body', frame).css('padding', 0)
    $('.modal-header .close').remove()
    return false;
}
function messageScrobbler(functionUrl, interval, onErrorClass, onErrorMessage){
    if (typeof interval == 'undefined')
        interval = false;
    if (typeof onErrorClass == 'undefined')
        onErrorClass = 'error'
    if (typeof onErrorMessage == 'undefined')
        onErrorMessage = 'Connection to Server Lost ';
    
    $.getJSON(webRoot+'/ajax/'+functionUrl, {}, function(res){
        //console.log(res)
        var lastMessage = ''
        $.each(res['data'],function(index, messageTuple){
            if(firstMessage){
                $('#install-shell').append('<li>XDM: ~$ <span class="'+messageTuple[0]+'">'+messageTuple[1]+'</span></li>')
            }else{
                $('#install-shell').append('<li><span class="'+messageTuple[0]+'">'+messageTuple[1]+'</span></li>')
            }
            p = $('#install-shell').parent();
            p.scrollTop(p[0].scrollHeight);
            firstMessage = false;
            lastMessage = messageTuple[1]
        })
        
        if(lastMessage != 'Done!' && !interval){
            window.setTimeout(function(){messageScrobbler(functionUrl, interval, onErrorClass, onErrorMessage)}, 500);
        }else if(lastMessage == 'Done!'){
            $('#install-shell').append('<li><span class="info">XDM: ~$</span></li>')
            $('#install-shell').parent().scrollTop(900000)
            var modal = $('#install-shell').parent().parent();
            $('.modal-footer button' ,modal).addClass('btn-success').text('Refresh page').focus().click(function(e){
                window.location.reload() 
            }).show()
            $(".modal-footer", modal).append('<span class="label label-info pull-left">Refreshing page in <span id="countdown"></span></span>');
            $("#countdown").simpleCountDown({interval:1000,startFrom:30,
                              callBack:function(){
                                    window.location.reload();
                              }
            });
           
        }
    }).error(function() {
        console.log($('#install-shell li:last-child').text(), onErrorMessage)
        var oldText = $('#install-shell li:last-child').text();
        if(oldText.substring(0, onErrorMessage.length) === onErrorMessage){
            $('#install-shell li:last-child').html( '<span class="'+onErrorClass+'">'+ oldText + "&shy;.</span>")
        }else{
            $('#install-shell').append('<li><span class="'+onErrorClass+'">'+onErrorMessage+'</span></li>')
        }
        $('#install-shell').parent().scrollTop(900000)
        if(interval)
            clearInterval(globalMessageInterval)
            
    });
}

function getAsciiArtLogo(){
    return [
'__   _______  __  __',
'\\ \\ / /  __ \\|  \\/  |',
' \\ V /| |  | | \\  / |',
'  > < | |  | | |\\/| |',
' / . \\| |__| | |  | |',
'/_/ \\_\\_____/|_|  |_|'
    ].join('\n');
    
    
}

