const pathStub = window.location.pathname;

function addRemoveButton(tag) {
	const removeButton = $('<a class="delete" href="#"></a>');
	const par = tag.parent();

	removeButton.click(function(e) {
		e.preventDefault();
		$.ajax({
			url: pathStub + '/tag/' + tag.text(),
			method: 'DELETE',
			success: remove => par.remove()
		});
	});

	par.append(removeButton);

	return removeButton;
}

function addRemoveButtons() {
	let arrButtons = [];

	$('.img-tags li>.tag').each(function () {
		arrButtons.push(addRemoveButton($(this)));
	});

	return arrButtons;
}

$(function() {
	const editButton = $('.edit-tags');
	editButton.click(function(e) {
		e.preventDefault();

		let arrButtons = addRemoveButtons();

		let addField = $('<input pattern="[a-z0-9](?:[a-z0-9-]*[a-z0-9-])?" type="text">');
		let addButton = $('<button>Add</button>');

		let addDiv = $('<div class="add-tag"></div>');
		addDiv.append(addField);
		addDiv.append(addButton);

		let enter = function(e) {
			const tag = addField.val();
			$.ajax({
				url: pathStub + '/tag/' + addField.val(),
				method: 'PUT',
				success: e => {
					let li = $('<li></li>');
					let a = $('<a class="tag" href="/tags/' + tag + '">' + tag + '</a>');
					li.append(a);
					li.insertBefore(addDiv);

					arrButtons.push(addRemoveButton(a));
				}
			});
		};

		addButton.click(enter);
		addField.keypress(function(e) {
			if (e.keyCode == 13) {
				enter(e);
			}
		});

		editButton.before(addDiv);

		const doneButton = $('<a class="done" href="#">Done editing...</a>');

		doneButton.click(function(e) {
			doneButton.before(editButton);

			addDiv.remove();

			for (i = 0; i < arrButtons.length; ++i) {
				arrButtons[i].remove();
			}

			doneButton.remove();
		});

		editButton.before(doneButton);

		editButton.detach();
	});
});
