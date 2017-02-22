import 'jquery';

export function sidebar() {

  if ($(".c-sidebar")[0]){
    $('body').addClass('has-sidebar');
  } else {
    $('body').removeClass('');
  }
}