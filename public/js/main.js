$(function() {

    $('.btn-link[aria-expanded="true"]').closest('.accordion-item').addClass('active');
  $('.collapse').on('show.bs.collapse', function () {
	  $(this).closest('.accordion-item').addClass('active');
	});

  $('.collapse').on('hidden.bs.collapse', function () {
	  $(this).closest('.accordion-item').removeClass('active');
	});

	$('form').submit((event) => {
		event.preventDefault();
		const roomType = $('#room-type').find(":selected").val();
		let selectedNames = null;
		if (roomType === 'boys') {
			selectedNames = $('#boys-select').val();
		} else {
			selectedNames = $('#girls-select').val();
		}
		
		if (selectedNames.length < 2) {
			alert('من فضلك اختار على الاقل اسمين');
		} else {
			console.log(roomType);
			console.log(selectedNames);
		}
	})
    

});