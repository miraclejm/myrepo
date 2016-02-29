<?php
    $name = $_POST["name"];
    $time = $_POST["time"];
    $title = $_POST["title"];
    $msg = $_POST["msg"];
    $db = mysqli_connect('localhost','root','123456');
    $db_selected = mysqli_select_db($db,'graduation');
    $query = "insert into comment (name,time,title,msg,comment,cuser,fireList)values('".$name."','".$time."','".$title."','".$msg."','','','')";
    if(mysqli_query($db,$query)){
        echo 1;
    }
    else{
        echo 0;
    }
    /*while ($row = mysqli_fetch_assoc($result))
    {
    $select = array("name"=>$row['name'],"time"=>$row['time'],"title"=>$row['title'],
        "msg"=>$row['msg'],"comment"=>$row['comment'],"cuser"=>$row['cuser'],
        "fireList"=>$row['fireList']);
    }
    $addFire = $select["fireList"] . "_jm_" . $cuser;
    $query2 = "update comment set fireList='".$addFire."' where time='".$time."'&&title='".$title."'&&name='".$name."'&&msg='".$msg."'";
    $result2 = mysqli_query($db,$query2);
    echo 1;*/
    mysqli_close($db);
?>