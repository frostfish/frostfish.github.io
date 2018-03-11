/*!
 * jQuery jqCart Plugin v1.1.2
 * requires jQuery v1.9 or later
 *
 * http://incode.pro/
 *
 * Date: Date: 2016-05-18 19:15
 */
;(function($) {
  'use strict';
  var cartData,
    itemData,
    orderPreview = '',
    totalCnt = 0,
    visibleLabel = false,
    label = $('.jqcart-cart-label'),
    modal = '<div class="jqcart-layout"><div class="jqcart-checkout"></div></div>',
    orderform = '<h2 id="user_info">Контактная информация:</h2>\
    <form class="jqcart-orderform">\
      <p>\
        <label>Телефон:</label>\
        <input type="text" name="user_phone" placeholder="Ваш номер телефона (в произвольном формате)">\
      </p>\
      <p>\
        <label>Почта:</label>\
        <input type="text" name="user_mail" placeholder="Ваш адрес электронной почты">\
      </p>\
      <p>\
        <label>Коментарий:</label>\
        <input type="text" name="user_comment" placeholder="Напишите здесь любой комментарий (не обязательно)">\
      </p>\
      <p>\
        <button id="submit" class="btn btn-success">Отправить заказ</button>\
        <button id="clear" class="btn btn-warning">Очистить корзину</button>\
        <button id="reset" class="btn">Вернуться к покупкам</button>\
      </p>\
    </form>';
  var opts = {
		buttons: '.add_item',
		cartLabel: 'body',
		visibleLabel: false,
		openByAdding: false,
    handler: '/',
		currency: '$'
  };
  var actions = {
    init: function(o) {
      opts = $.extend(opts, o);
      cartData = actions.getStorage();
      if (cartData !== null && Object.keys(cartData).length) {
        for (var key in cartData) {
          if (cartData.hasOwnProperty(key)) {
            totalCnt += 1;
          }
        }
        visibleLabel = true;
      }
      label.prependTo(opts.cartLabel)[visibleLabel || opts.visibleLabel ? 'show' : 'hide']()
        .on('click', actions.openCart)
        .find('.jqcart-total-cnt').text(totalCnt);
      $(document)
        .on('click', opts.buttons, actions.addToCart)
        .on('click', '.jqcart-layout', function(e) {
          if (e.target === this) {
            actions.hideCart();
          }
        })
        .on('click', '.jqcart-incr', actions.changeAmount)
				.on('input keyup', '.jqcart-amount', actions.changeAmount)
        .on('click', '.jqcart-del-item', actions.delFromCart)
        .on('click', '#clear', methods.clearCart)
        .on('click', '#reset', actions.hideCart)
        .on('click', '#submit', actions.sendOrder)
				.on('click', '.jqcart-print-order', actions.printOrder);
      return false;
    },
    addToCart: function(e) {
      e.preventDefault();
      itemData = $(this).data();
      var lotText = $(GetElementForId('.card-lot-selected', itemData.groupId))[0].innerText;
      var lotData = $(GetElementForId('.card-lot-selected', itemData.groupId)).data();
      var count = parseFloat(GetElementForId('.card-amount', itemData.groupId).innerHTML);
      
			if(typeof lotData.id === 'undefined') {
				console.log('Отсутствует ID товара');
				return false;
			}
      cartData = actions.getStorage() || {};
      if (cartData.hasOwnProperty(lotData.id)) {
        cartData[lotData.id].count += count;
      } else {
        cartData[lotData.id] = {
          img: itemData.img,
          price: lotData.price * lotData.lot,
          id: lotData.id,
          title: itemData.title + ' (фасовка ' + lotText + ')',
          count: count
        };
      }
      var scale = 1;
      var scaleDiff = 0.1;
      var animation = setInterval(function(){
        scale += scaleDiff
        if (scale < 1) {
          clearInterval(animation);
          return;
        } else if (scale > 2) {
          scaleDiff = -0.1;
        }
        $('.jqcart-cart-label').css('transform', 'scale('+scale+')')
      }, 10)
      actions.setStorage(cartData);
      actions.changeTotalCnt(1);
      label.show();
			if (opts.openByAdding) {
				actions.openCart();
			}
      return false;
    },
    delFromCart: function() {
      var $that = $(this),
        line = $that.closest('.jqcart-tr'),
        itemId = line.data('id');
      cartData = actions.getStorage();
      actions.changeTotalCnt(-cartData[itemId].count);
      delete cartData[itemId];
      actions.setStorage(cartData);
      line.remove();
      actions.recalcSum();
      return false;
    },
    changeAmount: function() {
      var $that = $(this),
				manually = $that.hasClass('jqcart-amount'),
        amount = +(manually ? $that.val() : $that.data('incr')),
        itemId = $that.closest('.jqcart-tr').data('id');
      cartData = actions.getStorage();
			if(manually) {
      	cartData[itemId].count = isNaN(amount) || amount < 1 ? 1 : amount;
			} else {
				cartData[itemId].count += amount;
			}
      if (cartData[itemId].count < 1) {
        cartData[itemId].count = 1;
      }
			if(manually) {
				$that.val(cartData[itemId].count);
			} else {
      	$that.siblings('input').val(cartData[itemId].count);
			}
      actions.setStorage(cartData);
      actions.recalcSum();
      return false;
    },
    recalcSum: function() {
      var subtotal = 0,
        amount,
        sum = 0,
        totalCnt = 0;
      $('.jqcart-tr').each(function() {
        amount = +$('.jqcart-amount', this).val();
        sum = Math.ceil((amount * $('.jqcart-price', this).text()) * 100) / 100;
        $('.jqcart-sum', this).html(sum + ' ' + opts.currency);
				subtotal = Math.ceil((subtotal + sum) * 100) / 100;
        totalCnt += amount;
      });
      $('.jqcart-subtotal strong').text(subtotal);
      $('.jqcart-total-cnt').text(totalCnt);
      if (totalCnt <= 0) {
				actions.hideCart();
				if(!opts.visibleLabel) {
        	label.hide();
				}
      }
      return false;
    },
    changeTotalCnt: function(n) {
      var cntOutput = $('.jqcart-total-cnt');
      cntOutput.text((+cntOutput.text() + n));
      return false;
    },
    openCart: function() {
      var subtotal = 0,
			cartHtml = '';
      cartData = actions.getStorage();
      orderPreview = '<button id="reset"  type="button" class="close" aria-label="Close"><span aria-hidden="true">&times;</span></button>\
      <h2 id="basket">Корзина <span class="jqcart-print-order"></span></h2>\
      <div class="jqcart-table-wrapper"><div class="jqcart-manage-order"><div class="jqcart-thead"><div></div><div>Наименование</div><div>Цена</div><div>Кол-во</div><div>Сумма</div><div></div></div>';
      var key, sum = 0;
      for (key in cartData) {
        if (cartData.hasOwnProperty(key)) {
					sum = Math.ceil((cartData[key].count * cartData[key].price) * 100) / 100;
					subtotal = Math.ceil((subtotal + sum) * 100) / 100;

          orderPreview += '<div class="jqcart-tr" data-id="' + cartData[key].id + '">';
					// orderPreview += '<div class="jqcart-small-td">' + cartData[key].id + '</div>';
					orderPreview += '<div class="jqcart-small-td jqcart-item-img"><img src="' + cartData[key].img + '" alt=""></div>';
          orderPreview += '<div>' + cartData[key].title + '</div>';
          orderPreview += '<div class="jqcart-price">' + cartData[key].price.toLocaleString('ru') + ' ' + opts.currency + '</div>';
          orderPreview += '<div><span class="jqcart-incr" data-incr="-1">&#8211;</span><input type="text" class="jqcart-amount" value="' + cartData[key].count + '"><span class="jqcart-incr" data-incr="1">+</span></div>';
          orderPreview += '<div class="jqcart-sum">' + (sum).toLocaleString('ru') + ' ' + opts.currency + '</div>';
					orderPreview += '<div class="jqcart-small-td"><span class="jqcart-del-item">удалить</span></div>';
          orderPreview += '</div>';
        }
      }
      orderPreview += '</div></div>';
      orderPreview += '<div class="jqcart-subtotal">Итого: <strong>' + subtotal.toLocaleString('ru') + '</strong> ' + opts.currency + '</div>';

			cartHtml = subtotal ? (orderPreview + orderform) : '<h2 class="jqcart-empty-cart">Корзина пуста</h2>';
      $(modal).appendTo('body').find('.jqcart-checkout').html(cartHtml);
    },
    hideCart: function() {
      $('.jqcart-layout').fadeOut('fast', function() {
        $(this).remove();
      });
      return false;
    },
    sendOrder: function(e) {
      e.preventDefault();
      var user_phone = $('[name=user_phone]').val();
      var user_mail = $('[name=user_mail]').val();
      var user_comment = $('[name=user_comment]').val();
      if ($('[name=user_phone]').val() === '') {
        $('<p class="jqcart-error">Пожалуйста, укажите контактный телефон</p>').insertAfter($('[name=user_phone]').first()).delay(3000).fadeOut();
        return false;
      }
      var user_data = {
        'phone': user_phone,
        'mail': user_mail,
        'comment': user_comment
      };
      var data = {
        orderlist: actions.getStorage(),
        userdata: user_data
      };
      $.ajax({
        url: opts.handler,
        type: 'POST',
				contentType: 'text/plain',
        dataType: 'json',
        data: JSON.stringify(data),
        error: function() {},
        success: function(resp) {
          $('.jqcart-checkout').html('<p>' + resp.message + '</p>');
					if(!resp.errors) {
						setTimeout(methods.clearCart, 2000);
					}
        }
      });
    },
		printOrder: function (){
			var data = $(this).closest('.jqcart-checkout').prop('outerHTML');
			if(!data) {
				return false;
			}
			var win = window.open('', 'Печать заказа', 'width='+screen.width+',height='+screen.height),
			cssHref = $(win.opener.document).find('link[href$="jqcart.css"]').attr('href'),
			d = new Date(),
			curDate = ('0' + d.getDate()).slice(-2) + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + d.getFullYear() + ' ' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2) + ':' + ('0' + d.getSeconds()).slice(-2);


			win.document.write('<html><head><title>Заказ ' + curDate + '</title>');
			win.document.write('<link rel="stylesheet" href="' + cssHref + '" type="text/css" />');
			win.document.write('</head><body >');
			win.document.write(data);
			win.document.write('</body></html>');

			win.document.close(); // нужно для IE >= 10
      win.focus(); // нужно для IE >= 10

			win.print();
			win.close();

			return true;
		},
    setStorage: function(o) {
      localStorage.setItem('jqcart', JSON.stringify(o));
      return false;
    },
    getStorage: function() {
      return JSON.parse(localStorage.getItem('jqcart'));
    }
  };
  var methods = {
		clearCart: function(){
			localStorage.removeItem('jqcart');
			label[opts.visibleLabel ? 'show' : 'hide']().find('.jqcart-total-cnt').text(0);
			actions.hideCart();
		},
		openCart: actions.openCart,
		printOrder: actions.printOrder,
		test: function(){
			actions.getStorage();
		}
	};
  $.jqCart = function(opts) {
    if (methods[opts]) {
      return methods[opts].apply(this, Array.prototype.slice.call(arguments, 1));
    } else if (typeof opts === 'object' || !opts) {
      return actions.init.apply(this, arguments);
    } else {
      $.error('Метод с именем "' + opts + '" не существует!');
    }
  };
})(jQuery);

function GetElementForId(className, id) {
  var classElements = $(className);
  var matched = null;
  $.each(classElements, function(i) {
    var classObject = classElements.get(i);
    if (classObject.dataset['groupId'] == id) {
      matched = classObject;
    }
  });
  return matched;
};

$(function(){
  'use strict';
  // инициализация плагина
  $.jqCart({
      buttons: '.btn-cart',
      handler: 'http://178.62.214.238/post-order',
      cartLabel: '.jqcart-cart-label',
      visibleLabel: true,
      openByAdding: false,
      currency: 'руб.'
  });
  // Пример с дополнительными методами
  $('#open').click(function(){
    $.jqCart('openCart'); // открыть корзину
  });
  $('#clear').click(function(){
    $.jqCart('clearCart'); // очистить корзину
  });
  $('.card-lot').click(function(o) {
    var id = o.target.dataset['id'];
    var groupId = o.target.dataset['groupId'];
    var lot = o.target.dataset['lot'];
    
    var collection = $('.card-lot');
    $.each(collection, function(i) {
      var object = collection.get(i);
      if (object.dataset['groupId'] == groupId) {
        if (object.dataset['lot'] == lot) {
          $(object).addClass('card-lot-selected');
        } else {
          $(object).removeClass('card-lot-selected');
        }
      }
    });

    var selectedLot = GetElementForId('.card-lot-selected', groupId);

    GetElementForId('.card-lot-price', groupId).innerHTML = selectedLot.dataset['price'];
    GetElementForId('.card-amount', groupId).innerHTML = 1;
    GetElementForId('.card-total-price', groupId).innerHTML = selectedLot.dataset['price'] * selectedLot.dataset['lot'];
  });

  $('.card-amount-add').click(function(o) {
    var groupId = o.target.dataset['groupId'];
    var selectedLot = GetElementForId('.card-lot-selected', groupId);
    var lot = $(selectedLot).data().lot;
    var price = $(selectedLot).data().price;
    
    var amountLabel = GetElementForId('.card-amount', groupId);
    amountLabel.innerHTML = Math.max(parseFloat(amountLabel.innerHTML)+1, 0);

    GetElementForId('.card-total-price', groupId).innerHTML = amountLabel.innerHTML * price * lot;
    $(GetElementForId('.btn-cart', groupId)).attr('data-count', amountLabel.innerHTML);
  });

  $('.card-amount-del').click(function(o) {
    var groupId = o.target.dataset['groupId'];
    var selectedLot = GetElementForId('.card-lot-selected', groupId);
    var lot = $(selectedLot).data().lot;
    var price = $(selectedLot).data().price;

    var amountLabel = GetElementForId('.card-amount', groupId);
    amountLabel.innerHTML = Math.max(parseFloat(amountLabel.innerHTML)-1, 0);

    GetElementForId('.card-total-price', groupId).innerHTML = amountLabel.innerHTML * price * lot;
    $(GetElementForId('.btn-cart', groupId)).attr('data-count', amountLabel.innerHTML);
  });
 
});
