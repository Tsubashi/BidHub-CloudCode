/**
 * Checks to make sure the user is logged in. Redirects them if they are not.
 * @return {Boolean} True if logged in, nothing otherwise (redirects window)
 */
function checkLogin() {
  $.get('/user/login_status', function(data, status, xhr) {
    return true;
  }).fail(function() {
    window.location.replace('/user/login?nextUrl='
                            + encodeURIComponent(window.location));
  });
  return false;
}
/**
 * Make the bid dialog display a loading screen
 */
function makeDlgLoad() {
  $('#bidDialog').html('<div class="loader" style="margin: 0 auto"></div>');
}
/**
 * Display the bid interface
 * @param {String} itemName Friendly name of the item displayed to user.
 * @param {String} itemId Passed to ajax load.
 */
function showBidDlg(itemName, itemId) { // eslint-disable-line no-unused-vars
  checkLogin();
  dlg = $('#bidDialog');
  makeDlgLoad();
  dlg.dialog({
    modal: true,
    closeOnEscape: true,
    width: '75%',
    resizable: false,
    show: {effect: 'scale', duration: 200},
    hide: {effect: 'scale', duration: 200},
    create: function(event, ui) {
      $(this).parent().css('max-width', '500px');
    },
  });
  dlg.dialog('open');
  dlg.load('auction/placeBid?id=' + encodeURIComponent(itemId),
    function(response, status, xhr) {
      if (status === 'error') {
        dlg.dialog( 'option', 'title', 'Error' );
        let msg = 'While trying to open the bidding interface, I ran into an '
                + 'error: ';
        dlg.html( msg + xhr.status + ': ' + response );
      } else {
        dlg.dialog( 'option', 'title', itemName );
      }
      dlg.dialog( 'option', 'position',
        {my: 'center', at: 'center', of: window} );
      $('#bidForm').bind('submit', function(e) {
        doBid(e);
      });
    }
  );
}

/**
 * Attempt to place a bid
 * @param {Event} e Submit event that we need to cancel
 */
function doBid(e) {
  checkLogin();
  itemId = $('#itemId').attr('value');
  e.preventDefault();
  form = $('#bidForm');
  $.ajax({
    type: form.attr('method'),
    url: form.attr('action'),
    data: form.serialize(),
    success: function(data) {
      window.location.hash = itemId;
      window.location.replace(window.location);
      window.location.reload(true);
    },
    error: function(data) {
      $('#bidDialog').html(data);
    },
  }).fail(function(xhr, status, error) {
    $('#bidDialog').html('Error: ' + xhr.responseText);
  });
makeDlgLoad();
}

