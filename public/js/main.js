;(function () {
	let url = window.location.href
	let tags = ''
	let post_btn = ''
	let simplemde
	let simplemdeId = ''
	let returnCitySN = ''
	let herder_status = $('.header.editor-header .status-text')
	let userID = $('.user-photo.nav-link .toggle-btn').length ? $('.user-photo.nav-link .toggle-btn').data().userId : ''
	$.each($('input:checkbox'), function () {
		if ($(this).is(':checked')) {
			tags += `<span id="${$(this).attr('id')}" value="${$(
				this
			).val()}" class="badge badge-light mr-2 active">${$(this).siblings('label').text()}</span>`
		} else {
			tags += `<span id="${$(this).attr('id')}" value="${$(this).val()}" class="badge badge-light mr-2">${$(this)
				.siblings('label')
				.text()}</span>`
		}
	})

	if (url.indexOf('edit') != -1) {
		simplemdeId = $('textarea').attr('id')
		post_btn =
			'<div id="post-edit-btn" class="mt-4 mb-2 d-flex justify-content-center"><button type="button" class="btn btn-outline-primary btn-sm edit-btn">Confirm and Update</button></div>'
	} else if (url.indexOf('create') != -1) {
		simplemdeId = 'simplemde'
		post_btn =
			'<div id="post-create-btn" class="mt-4 mb-2 d-flex justify-content-center"><button type="button" class="btn btn-outline-primary btn-sm edit-btn">Confirm and Publish</button></div>'
	}

	$(document).on('click', '.popover-body .badge', function () {
		let _this = $(this)
		$.each($('input:checkbox'), function () {
			if (_this.attr('id') == $(this).attr('id')) {
				$(this).attr('checked', !$(this).is(':checked'))
			}
		})
		$(this).toggleClass('active')
	})

	$('#myPopover').popover({
		title: '<h6 class="text-muted mt-1">TAGS</h6>',
		content: tags + post_btn,
		html: true
	})

	if (simplemdeId && $('#' + simplemdeId).length) {
		simplemde = new SimpleMDE({
			element: $('#simplemde')[0],
			autosave: {
				enabled: true,
				uniqueId: simplemdeId,
				delay: 1500
			},
			spellChecker: false,
			renderingConfig: {
				codeSyntaxHighlighting: true
			},
			autofocus: false,
			autoDownloadFontAwesome: false,
			toolbar: [
				'bold',
				'italic',
				'heading',
				'|',
				'horizontal-rule',
				'quote',
				'unordered-list',
				'ordered-list',
				'|',
				'link',
				// 'image',
				'table',
				'|',
				'side-by-side',
				'fullscreen',
				'guide'
			]
		})
		simplemde.toggleSideBySide()
		simplemde.toggleFullScreen()
		$('.post-content.loading').removeClass('loading')
		herder_status.text('Post ' + $('.editor-statusbar .autosave').text())
		setInterval(() => {
			herder_status.text('Post ' + $('.editor-statusbar .autosave').text())
		}, 61000)
	}

	$('pre code').each(function (i, block) {
		hljs.highlightBlock(block)
	})

	$('#edit-title').on('change', function () {
		if ($('#edit-title').length) {
			$('input[name="title"]').val($('#edit-title').val())
		} else if ($('#create-title').length) {
			$('input[name="title"]').val($('#create-title').val())
		}
	})

	$(document).on('click', '#post-edit-btn', function () {
		simplemde.clearAutosavedValue()
		$('#edit-btn').trigger('click')
	})
	$(document).on('click', '#post-create-btn', function () {
		if ($('input[name="title"]').val() == '') {
			$('.top-right')
				.notify({
					type: 'danger',
					closable: false,
					message: {
						text: "Title can't be blank "
					}
				})
				.show()
		} else if (simplemde.value() == '') {
			$('.top-right')
				.notify({
					type: 'danger',
					closable: false,
					message: {
						text: "Content can't be blank"
					}
				})
				.show()
		} else {
			simplemde.clearAutosavedValue()
			$('#create-btn').trigger('click')
		}
	})

	const deleteButton = $('.author .post-action .post-delete-btn')
	$(deleteButton).on('click', function () {
		const _this = $(this)
		$('.post-alert .modal .modal-body').html(
			'确定删除 <h6 style="display: inline;color: #333;">' + $(this).data('post-title') + '</h6>，删除文章后，不可恢复'
		)
		$('#delete-confirm').click(function () {
			const id = _this.data('id')
			const _csrf = _this.data('csrf')
			const userId = _this.data('user-id')

			$.ajax({
				url: '/posts/' + encodeURIComponent(id),
				method: 'DELETE',
				data: {
					_csrf
				},
				success: (response) => {
					if (response == 'success') {
						window.location.href = '/users/' + userId
					}
				}
			})
			$('.post-alert .modal').modal('hide')
		})
	})

	const likeElement = $('.post-suspended-panel .post-panel.likes')
	const userId = likeElement.data('user')
	const post_id = likeElement.data('id')
	const cookieName = 'uniqueness' + userId + post_id
	if (
		Cookies.getJSON(cookieName) &&
		Cookies.getJSON(cookieName).userId == userId &&
		Cookies.getJSON(cookieName).cookieId == post_id &&
		!userID
	) {
		likeElement.unbind('click')
		likeElement.addClass('active')
		likeElement.find('.is-liked').addClass('liked')
		$('.status .likes .icon-love').addClass('liked')
	} else if (post_id && !userID) {
		likeElement.on('click', function () {
			const time = new Date().getTime()
			const ip = returnCitySN['cip'] + returnCitySN['cname']
			const userAgent = navigator.userAgent
			const uniqueness_cookie = time + ip + userAgent
			let likes = $(this).attr('badge')
			const _this = $(this)
			Cookies.set(cookieName, { cookieContent: uniqueness_cookie, cookieId: post_id, userId: userId })
			$.ajax({
				url: `/share/${post_id}/like`,
				method: 'GET',
				data: {
					uniqueness_cookie: uniqueness_cookie
				},
				success: function (response) {
					if (response.status == 'success') {
						if (Cookies.getJSON(cookieName).cookieContent == response.cookie) {
							_this.addClass('active')
							_this.attr('badge', parseInt(likes) + 1)
							$('.status .likes').html(
								`<i class="iconfont icon-love liked mr-2"></i>${parseInt(likes) + 1}`
							)
							_this.unbind('click')
							_this.find('.is-liked').addClass('liked')
							$('.top-left')
								.notify({
									type: 'warning',
									closable: false,
									message: {
										text: '您还没有登录,不会保存点赞的文章记录 :('
									}
								})
								.show()
						}
					}
				}
			})
		})
	} else if (userID) {
		likeElement.on('click', function () {
			let likes = $(this).attr('badge')
			$(this).addClass('active')
			$(this).attr('badge', parseInt(likes) + 1)
			$('.status .likes').html(`<i class="iconfont icon-love liked mr-2"></i>${parseInt(likes) + 1}`)
			$(this).unbind('click')
			$(this).find('.is-liked').addClass('liked')
		})
		if (likeElement.hasClass('active')) likeElement.unbind('click')
	}

	const listLikes = $('.likes .icon-love')
	const likeIds = Object.keys(Cookies.get())

	if (listLikes.length > 0) {
		$.each(likeIds, function (i, n) {
			if (n.indexOf('uniqueness') != -1) {
				const id = n.slice(10, n.length)
				listLikes.each(function (a, b) {
					if (id == $(this).attr('user') + $(this).attr('id')) {
						$(this).addClass('liked')
					} else if (!userID && id == $(this).attr('id')) {
						$(this).addClass('liked')
					}
				})
			}
		})
	}

	$('#file-icon').on('click', function () {
		$('#file').click()
	})

	$('#file').on('change', function () {
		$('.file-input .text-success small').text($(this).get(0).files[0].name)
		$('.file-input .text-muted small').text('')
	})

	$('.container.frofile .list-group-item .input-box .input-content .action-box').on('click', function () {
		$(this).siblings('input').select()
	})

	if ($('.invalid-feedback').length) {
		$('.invalid-feedback').css('display', 'block')
	}

	if ($('.post-suspended-panel .top').length) {
		$('.post-suspended-panel .top').on('click', function () {
			$(document).scrollTop(0)
		})
	}

	var p = 0,
		t = 0
	$(document).on('scroll', function (e) {
		p = $(this).scrollTop()
		if (t <= p) {
			//下滚
			if ($(window).scrollTop() > 46) {
				if (!$('.limit-width').hasClass('slideOutUp'))
					$('.limit-width').addClass('slideOutUp').removeClass('slideInDown')
				if (!$('.profile-nav').hasClass('up')) $('.profile-nav').addClass('up').removeClass('down')
			}
		} else {
			//上滚
			if ($('.limit-width').hasClass('slideOutUp'))
				$('.limit-width').removeClass('slideOutUp').addClass('slideInDown')
			if ($('.profile-nav').hasClass('up')) $('.profile-nav').removeClass('up').addClass('down')
		}
		setTimeout(function () {
			t = p
		}, 0)
	})
	let viewer
	if ($('.post-content>.post-details').length) {
		viewer = new Viewer($('.post-content>.post-details')[0], {
			toolbar: false,
			button: false,
			navbar: false,
			movable: false,
			zoomable: false,
			toggleOnDblclick: false,
			shown () {
				$(document).on('click', '.viewer-container img', function () {
					viewer.hide()
				})
			}
		})
	}

	$(document).on('mousewheel', '.viewer-container', function () {
		viewer.hide()
	})

	if (location.href == location.protocol + '//' + location.host + '/chatRooms') {
		document.addEventListener('visibilitychange', function () {
			if (
				document.visibilityState == 'hidden' &&
				location.href != location.protocol + '//' + location.host + '/chatRooms'
			) {
				userID = encodeURIComponent(userID)
				$.ajax({
					url: `/chatRoom/activity/remove/${userID}}`,
					method: 'get',
					success: (response) => {
						if (response == 'success') {
						}
					}
				})
			}
		})
	}

	$('.navbar-nav .nav-link.chatroom').on('click', function () {
		let cip = returnCitySN['cip']
		cip = encodeURIComponent(cip)
		if ($(this).data('isActivityLogged') == 'Anonymous') {
			$.ajax({
				url: '/chatRooms/' + cip,
				method: 'get',
				success: (response) => {
					if (response == 'success') {
					}
				}
			})
		}
	})

	$('.user-content .follow .follow-me').on('click', function () {
		const userId = $(this).data().userId
		const _this = $(this)
		let followId = userID ? userID : 0
		if (userId) {
			$.ajax({
				url: '/follow/' + followId + '/' + userId,
				method: 'get',
				success: (response) => {
					if (response.message == 'success' && response.type == 'insert') {
						_this.html('<i class="iconfont icon-follow"></i><span class= "text">Followed</span>')
						_this.addClass('followed')
					} else if ((response.message = 'success' && response.type == 'delete')) {
						_this.html('<i class="iconfont icon-guanzhu"></i><span class= "text">Follow</span>')
						_this.removeClass('followed')
					} else if (response == 'login') {
						location.href = location.protocol + '//' + location.host + '/login'
					}
				}
			})
		}
	})

	$('.follower .follow-btn').on('click', function () {
		const userId = $(this).data().userId
		const _this = $(this)
		let followId = userID ? userID : 0
		if (userId) {
			$.ajax({
				url: '/follow/' + followId + '/' + userId,
				method: 'get',
				success: (response) => {
					if (response.message == 'success' && response.type == 'insert') {
						_this
							.find('.icon-box')
							.html(
								'<div class="icon text-center"><i class="iconfont icon-follow d-block"></i></div><div class= "text"> Followed</div>'
							)
						_this.addClass('followed')
					} else if ((response.message = 'success' && response.type == 'delete')) {
						_this
							.find('.icon-box')
							.html(
								'<div class="icon text-center"><i class="iconfont icon-guanzhu d-block"></i></div><div class= "text"> Follow</div>'
							)
						_this.removeClass('followed')
					} else if (response == 'login') {
						location.href = location.protocol + '//' + location.host + '/login'
					}
				}
			})
		}
	})

	if (location.href.indexOf(location.protocol + '//' + location.host + '/notification') && userID) {
		$.ajax({
			url: '/notification/num/' + userID,
			method: 'get',
			success: (data) => {
				if (data.notices == 0) {
					$('.navbar-collapse .navbar-nav .nav-item div.notification-badge')
						.attr('badge', '0')
						.css('display', 'none')
				} else {
					$('.navbar-collapse .navbar-nav .nav-item div.notification-badge')
						.attr('badge', data.notices)
						.css('display', 'block')
				}
			}
		})
	}

	$('.post-suspended-panel .post-panel.weibo div').hover(
		function () {
			$(this).css('background-image', "url('/image/weibo1.png')")
		},
		function () {
			$(this).css('background-image', "url('/image/weibo.png')")
		}
	)

	var ShareTip = function () {}
	ShareTip.prototype.sharetosina = function (title, url) {
		var sharesinastring =
			'http://v.t.sina.com.cn/share/share.php?title=' + title + '&url=' + url + '&content=utf-8&sourceUrl=' + url
		window.open(sharesinastring, '_blank')
	}

	ShareTip.prototype.sharetoqq = function (title, url, content) {
		var _shareUrl = 'https://connect.qq.com/widget/shareqq/index.html?'
		_shareUrl += 'url=' + encodeURIComponent(url || location.href)
		_shareUrl += '&title=' + encodeURIComponent(title || document.title)
		window.open(_shareUrl, '_blank')
	}

	$('.post-suspended-panel .post-panel.weibo').on('click', function () {
		var shareTitle = $('.post-details>h1').text()
		var shareContent = $('.post-content .post-details>div:not(.author)').text().substring(0, 80) + '...'
		var shareUrl = window.location.href
		var share1 = new ShareTip()
		share1.sharetosina(shareTitle + ' —— ' + shareContent, shareUrl)
	})

	$('.post-suspended-panel .post-panel.qq').on('click', function () {
		var shareTitle = $('.post-details>h1').text()
		var shareContent = $('.post-content .post-details>div:not(.author)').text().substring(0, 80) + '...'
		var shareUrl = window.location.href
		var share1 = new ShareTip()
		share1.sharetoqq(shareTitle + ' —— ' + shareContent, shareUrl, shareContent)
	})

	const shareUrl = window.location.href
	$('.post-suspended-panel .post-panel.wechat .wechat-img').empty().qrcode({
		render: 'img',
		text: shareUrl,
		size: 85,
		background: '#fff',
		minVersion: 5,
		top: 52
	})

	$('.post-suspended-panel .post-panel.wechat').hover(
		function () {
			$(this).find('.wechat-img').css('display', 'block')
			$(this).find('a').css('color', '#00b30b')
		},
		function () {
			$(this).find('.wechat-img').css('display', 'none')
			$(this).find('a').css('color', '#9e9e9e')
		}
	)

	$('.post-details p > img').each(function () {
		if ($(this).attr('title')) {
			$(this).after('<div class="img-title">' + $(this).attr('title') + '</div>')
		} else if ($(this).attr('alt')) {
			$(this).after('<div class="img-title">' + $(this).attr('alt') + '</div>')
		}
  })
  let anim
  if ($('.image-load .lottie').length) {
    anim = lottie.loadAnimation({
      container: $('.image-load .lottie')[0],
      renderer: 'svg',
      loop: true,
      autoplay: false,
      path: '/EmojiReaction.json'
    })
    anim.addEventListener('loopComplete', () => {
      anim.pause()
      $('.image-load').removeClass('loading')
      $('.image-load .box .text').text('The picture is being uploaded...').removeClass('text-success').addClass('text-muted')
    })
  }

	$('.post-content .editor-toolbar a[title="Create Link (Cmd-K)').after(
		'<a title="Insert Image (Cmd-⌥-I)" tabindex="-1" class="fa fa-picture-o insert-image"></a>'
	)

	$('.post-content .editor-toolbar').on('click', 'a.insert-image', function () {
		$('#post-image').click()
	})

	let putUrl = 'https://upload-z2.qiniup.com/putb64/-1'

	function putb64 (pic, token, callback) {
		var xhr = new XMLHttpRequest()
		xhr.onreadystatechange = function () {
			if (xhr.readyState == 4) {
				var response = JSON.parse(xhr.responseText)
				callback(response.key)
			}
		}
		xhr.open('POST', putUrl, true)
		xhr.setRequestHeader('Content-Type', 'application/octet-stream')
		xhr.setRequestHeader('Authorization', `UpToken ${token}`)
		xhr.send(pic)
	}

	$('#post-image').on('change', function () {
		const image = $(this).get(0).files[0]
		if (image.size && image.size / 1024 / 1024 < 6) {
			$.ajax({
				url: '/image/upload/',
				method: 'get',
				success: (data) => {
					const reader = new FileReader()
					reader.readAsDataURL(image)
					reader.onload = function (e) {
						const token = data
						const content = reader.result
						const pic = content.substr(content.indexOf('base64') + 'base64'.length + 1)
						$('.image-load').addClass('loading')

						putb64(pic, token, (url) => {
							const imgUrl = 'https://cdn.lishaoy.net/' + url
							const img = `![](${imgUrl})`
							const value = simplemde.value()
              simplemde.value(value + img)
              anim.setSpeed(2)
              anim.play()
              $('.image-load .box .text').text('Picture uploaded successfully').removeClass('text-muted').addClass('text-success')
						})
					}
				}
			})
		}
	})

	$('.CodeMirror').on('paste', function (e) {
		e.preventDefault()
		let text = (e.originalEvent || e).clipboardData.getData('text/plain')

		let clipboardData = e.originalEvent.clipboardData || e.clipboardData,
			files,
			items,
			item,
			key

		$.ajax({
			url: '/image/upload/',
			method: 'get',
			async: false,
			success: function (data) {
				key = data
			}
		})

		if (clipboardData) {
			items = clipboardData.items
			if (items && items.length && clipboardData.types.indexOf('Files') > 0) {
				for (var i = 0; i < clipboardData.types.length; i++) {
					if (clipboardData.types[i] === 'Files') {
						item = items[i]
						break
					}
				}
				if (item && item.kind === 'file' && item.type.match(/^image\//i)) {
					if (item.getAsFile().size / 1024 / 1024 > 3.6) {
						$('.top-right')
							.notify({
								type: 'danger',
								closable: false,
								message: {
									text: 'The image size cannot exceed 3.6M'
								}
							})
							.show()
					} else {
						const reader = new FileReader()
						reader.onload = function (e) {
							const token = key
							const content = e.target.result
							const pic = content.substr(content.indexOf('base64') + 'base64'.length + 1)
							$('.image-load').addClass('loading')

							putb64(pic, token, (url) => {
								const imgUrl = 'https://cdn.lishaoy.net/' + url
								const img = `![](${imgUrl})`
								let value = simplemde.value()
								value = value.replace(text, '')
								simplemde.value(value + img)
								$('.CodeMirror .CodeMirror-scroll').scrollTop(
									$('.CodeMirror .CodeMirror-scroll')[0].scrollHeight
								)
                anim.setSpeed(2)
                anim.play()
                $('.image-load .box .text').text('Picture uploaded successfully').removeClass('text-muted').addClass('text-success')
							})
						}
						reader.readAsDataURL(item.getAsFile())
					}
				}
			}
		}
	})
})()
