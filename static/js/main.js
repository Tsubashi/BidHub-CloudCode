$(document).ready(function(){
	$('.app_link').click(function(e){
		event.preventDefault();
		$(window).scrollTo({top:$("#hero").position().top, left:'0px'}, 1000);		
	});

	$('.sign_in_link').click(function(e){
		event.preventDefault();
		$(window).scrollTo({top:$("#sign_in").position().top, left:'0px'}, 1000);		
	});


	//Show & Hide menu on mobile
	$('.burger_icon').click(function(){
		$('header nav').toggleClass('show');
		$('header .burger_icon').toggleClass('active');
	});


	//wow.js on scroll animations initialization
	wow = new WOW(
	    {
		  animateClass: 'animated',
		  mobile: false,
		  offset: 50
		}
	);
	wow.init();


	//parallax effect initialization
	$('.hero').each(function(){
	   $(this).parallax("50%", 0.3); 
	});


	//Nice scroll initialization
	$("html").niceScroll({
		scrollspeed: 50,
		autohidemode : false,
		cursorwidth : 8,
		cursorborderradius: 8,
		cursorborder : "0",
		background : "rgba(48, 48, 48, .4)",
		cursorcolor : '#1f1f1f',
		zindex : 999
	});

});